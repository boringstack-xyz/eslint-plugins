import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { matchesAnyGlob } from "../utils/glob";
import {
  DEFAULT_CONSTRUCT_EVENT_NAMES,
  analyzeStripeImports,
  fileMentionsConstructEvent,
  getCalleeName,
  getFunctionDisplayName,
  isConstructEventCall,
  isRawBodyExpression,
  isStripeAwareFile,
  type FunctionLike,
  type StripeImports
} from "../utils/stripe";

export const RULE_NAME = "handler-must-verify-signature";

export interface HandlerMustVerifySignatureOptions {
  readonly webhookFilePattern?: string | readonly string[];
  readonly constructEventNames?: readonly string[];
  readonly allowFunctions?: readonly string[];
  readonly bodyParamNames?: readonly string[];
}

type RuleOptions = [HandlerMustVerifySignatureOptions];
type MessageIds = "unverifiedPayload";

// Webhook detection by filename. Kept tight on purpose: broader globs
// (e.g. `**/billing/**`) caused false positives on every Elysia handler
// in the billing folder that destructured `{ body }` for non-webhook
// routes. The function-name heuristic (`/webhook/i`) and the
// "stripe-imported file with a constructEvent call" heuristic still
// catch handlers placed in unconventional locations.
const DEFAULT_FILE_PATTERNS: readonly string[] = [
  "**/webhooks/**/*.{ts,tsx}",
  "**/*webhook*.{ts,tsx}"
];

const DEFAULT_BODY_PARAM_NAMES: readonly string[] = [
  "payload",
  "body",
  "rawBody"
];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    webhookFilePattern: {
      oneOf: [
        { type: "string" },
        {
          type: "array",
          items: { type: "string" },
          uniqueItems: true
        }
      ]
    },
    constructEventNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    },
    allowFunctions: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    },
    bodyParamNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  }
};

export const handlerMustVerifySignatureRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow reading or forwarding the webhook payload before a successful `*.constructEvent(...)` call — protects against forged Stripe events.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      unverifiedPayload:
        "Stripe webhook payload used before signature verification — call `*.constructEvent(...)` first to reject forged events."
    }
  },
  defaultOptions: [
    {
      webhookFilePattern: DEFAULT_FILE_PATTERNS,
      constructEventNames: ["constructEvent"],
      allowFunctions: [],
      bodyParamNames: DEFAULT_BODY_PARAM_NAMES
    }
  ],
  create(context, [options]) {
    const constructEventNames = new Set(
      options.constructEventNames ?? DEFAULT_CONSTRUCT_EVENT_NAMES
    );
    const allowFunctions = new Set(options.allowFunctions ?? []);
    const bodyParamNames = new Set(
      options.bodyParamNames ?? DEFAULT_BODY_PARAM_NAMES
    );

    const filePatterns = normalizePatterns(
      options.webhookFilePattern ?? DEFAULT_FILE_PATTERNS
    );

    let imports: StripeImports = {
      hasStripeImport: false,
      defaultBindings: new Set(),
      namespaceBindings: new Set(),
      cjsBindings: new Set(),
      eventTypeAliases: new Set()
    };
    let fileHasConstructEvent = false;

    return {
      Program(program) {
        imports = analyzeStripeImports(program);
        fileHasConstructEvent = fileMentionsConstructEvent(
          program,
          constructEventNames
        );
      },
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(
        node: FunctionLike
      ) {
        if (!isWebhookHandler(node, context.filename, imports, fileHasConstructEvent, filePatterns)) {
          return;
        }

        // Seed the tracked-name set with parameters of THIS function
        // that match a body-param name. Tracking the global names list
        // led to false positives on every handler that destructures
        // `{ body }` for non-webhook routes. Local variables tainted
        // from `request.json()` / `req.rawBody` get added during the walk.
        const boundBodyNames = collectBodyParamNames(node, bodyParamNames);
        analyzeHandler(node, boundBodyNames);
      }
    };

    function analyzeHandler(
      node: FunctionLike,
      initialNames: ReadonlySet<string>
    ): void {
      const violations: TSESTree.Node[] = [];
      // Mutable: parameters bound as body + locals tainted via assignment
      // from raw-body sources (`await request.json()`, `req.rawBody`, …)
      // both count.
      const taintedNames = new Set<string>(initialNames);
      let verified = false;

      walkSourceOrder(node.body, (current, ancestors) => {
        if (verified) {
          return;
        }

        if (
          current.type === AST_NODE_TYPES.CallExpression &&
          isConstructEventCall(current, constructEventNames)
        ) {
          verified = true;
          return;
        }

        if (
          current.type === AST_NODE_TYPES.CallExpression &&
          isAllowedWrapperCall(current, allowFunctions)
        ) {
          return;
        }

        if (isAncestorAllowedWrapper(ancestors, allowFunctions)) {
          return;
        }

        if (isRawBodyExpression(current)) {
          return;
        }

        // `const X = <raw-body source>` taints `X` for the rest of the walk.
        if (
          current.type === AST_NODE_TYPES.VariableDeclarator &&
          current.id.type === AST_NODE_TYPES.Identifier &&
          isRawBodySourceExpression(current.init)
        ) {
          taintedNames.add(current.id.name);
          return;
        }

        if (isAwaitedRequestJson(current)) {
          violations.push(current);
          return;
        }

        if (
          current.type === AST_NODE_TYPES.Identifier &&
          taintedNames.has(current.name) &&
          isMeaningfulIdentifierUse(current, ancestors)
        ) {
          violations.push(current);
        }
      });

      for (const v of violations) {
        context.report({ node: v, messageId: "unverifiedPayload" });
      }
    }
  }
});

/**
 * Recognises expressions that produce a raw webhook body — anything we
 * see assigned from one of these sources should be treated as the
 * webhook payload until it's verified.
 *
 *   await request.json()    // body parsed from raw HTTP request
 *   await request.text()
 *   request.body / req.body
 *   request.rawBody / req.rawBody
 */
function isRawBodySourceExpression(
  expr: TSESTree.Expression | null | undefined
): boolean {
  if (!expr) {
    return false;
  }

  if (expr.type === AST_NODE_TYPES.AwaitExpression) {
    return isRawBodySourceExpression(expr.argument);
  }

  if (
    expr.type === AST_NODE_TYPES.CallExpression &&
    expr.callee.type === AST_NODE_TYPES.MemberExpression &&
    expr.callee.property.type === AST_NODE_TYPES.Identifier &&
    ["json", "text", "arrayBuffer", "formData"].includes(
      expr.callee.property.name
    )
  ) {
    return true;
  }

  if (
    expr.type === AST_NODE_TYPES.MemberExpression &&
    expr.property.type === AST_NODE_TYPES.Identifier &&
    ["rawBody", "body"].includes(expr.property.name)
  ) {
    return true;
  }

  return false;
}

function isAncestorAllowedWrapper(
  ancestors: readonly TSESTree.Node[],
  allowFunctions: ReadonlySet<string>
): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (
      a &&
      a.type === AST_NODE_TYPES.CallExpression &&
      isAllowedWrapperCall(a, allowFunctions)
    ) {
      return true;
    }
  }
  return false;
}

function normalizePatterns(
  patterns: string | readonly string[]
): readonly string[] {
  return typeof patterns === "string" ? [patterns] : patterns;
}

function isWebhookHandler(
  node: FunctionLike,
  filename: string,
  imports: StripeImports,
  fileHasConstructEvent: boolean,
  filePatterns: readonly string[]
): boolean {
  const name = getFunctionDisplayName(node);
  const fileIsStripe = isStripeAwareFile(imports);

  if (name && /webhook/i.test(name)) {
    return true;
  }

  if (matchesAnyGlob(filename, filePatterns)) {
    return true;
  }

  if (fileIsStripe && fileHasConstructEvent) {
    return true;
  }

  if (fileIsStripe && (name === "POST" || name === "handler")) {
    return true;
  }

  return false;
}

function collectBodyParamNames(
  node: FunctionLike,
  bodyParamNames: ReadonlySet<string>
): Set<string> {
  const names = new Set<string>();

  for (const param of node.params) {
    // Skip parameters typed as `Stripe.Event` (or aliased Event from
    // the Stripe SDK). The TypeScript type-system already encodes "this
    // value came from a successful constructEvent call" — flagging
    // accesses to its members is a false positive.
    if (isStripeEventParam(param)) {
      continue;
    }
    addBindingNames(param, bodyParamNames, names);
  }

  return names;
}

function isStripeEventParam(param: TSESTree.Parameter): boolean {
  const target =
    param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;

  if (
    target.type !== AST_NODE_TYPES.Identifier ||
    !("typeAnnotation" in target) ||
    target.typeAnnotation === undefined
  ) {
    return false;
  }

  const annotation = target.typeAnnotation.typeAnnotation;
  if (annotation.type !== AST_NODE_TYPES.TSTypeReference) {
    return false;
  }

  // `Stripe.Event` — qualified reference
  if (
    annotation.typeName.type === AST_NODE_TYPES.TSQualifiedName &&
    annotation.typeName.left.type === AST_NODE_TYPES.Identifier &&
    annotation.typeName.left.name === "Stripe" &&
    annotation.typeName.right.type === AST_NODE_TYPES.Identifier &&
    annotation.typeName.right.name === "Event"
  ) {
    return true;
  }

  return false;
}

function addBindingNames(
  param: TSESTree.Parameter,
  bodyParamNames: ReadonlySet<string>,
  out: Set<string>
): void {
  if (param.type === AST_NODE_TYPES.Identifier && bodyParamNames.has(param.name)) {
    out.add(param.name);
    return;
  }

  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    addBindingNames(param.left as TSESTree.Parameter, bodyParamNames, out);
    return;
  }

  if (param.type === AST_NODE_TYPES.ObjectPattern) {
    for (const prop of param.properties) {
      if (
        prop.type === AST_NODE_TYPES.Property &&
        prop.value.type === AST_NODE_TYPES.Identifier &&
        bodyParamNames.has(prop.value.name)
      ) {
        out.add(prop.value.name);
      }
    }
  }
}

function isAllowedWrapperCall(
  call: TSESTree.CallExpression,
  allowFunctions: ReadonlySet<string>
): boolean {
  const callee = getCalleeName(call);

  if (!callee) {
    return false;
  }

  if (allowFunctions.has(callee)) {
    return true;
  }

  const last = callee.split(".").pop();

  return last !== undefined && allowFunctions.has(last);
}

function isAwaitedRequestJson(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.AwaitExpression) {
    return false;
  }

  if (node.argument.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const inner = node.argument;

  return (
    inner.callee.type === AST_NODE_TYPES.MemberExpression &&
    inner.callee.property.type === AST_NODE_TYPES.Identifier &&
    inner.callee.property.name === "json"
  );
}

function isMeaningfulIdentifierUse(
  ident: TSESTree.Identifier,
  ancestors: readonly TSESTree.Node[]
): boolean {
  const parent = ancestors[ancestors.length - 1];

  if (!parent) {
    return false;
  }

  if (
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id === ident
  ) {
    return false;
  }

  if (
    parent.type === AST_NODE_TYPES.Property &&
    parent.key === ident &&
    !parent.computed
  ) {
    return false;
  }

  if (parent.type === AST_NODE_TYPES.MemberExpression && parent.property === ident && !parent.computed) {
    return false;
  }

  if (
    (parent.type === AST_NODE_TYPES.FunctionDeclaration ||
      parent.type === AST_NODE_TYPES.FunctionExpression ||
      parent.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
    "params" in parent &&
    Array.isArray(parent.params) &&
    parent.params.includes(ident as TSESTree.Identifier as never)
  ) {
    return false;
  }

  return true;
}

interface AncestorWalker {
  (node: TSESTree.Node, ancestors: readonly TSESTree.Node[]): void;
}

function walkSourceOrder(
  root: TSESTree.Node,
  visit: AncestorWalker
): void {
  const ancestors: TSESTree.Node[] = [];
  const visited = new WeakSet<object>();

  function descend(node: TSESTree.Node): void {
    if (visited.has(node as object)) {
      return;
    }

    visited.add(node as object);
    visit(node, ancestors);

    ancestors.push(node);

    const children = collectChildren(node);

    for (const child of children) {
      descend(child);
    }

    ancestors.pop();
  }

  descend(root);
}

function collectChildren(node: TSESTree.Node): TSESTree.Node[] {
  const out: TSESTree.Node[] = [];

  for (const [key, value] of Object.entries(
    node as unknown as Record<string, unknown>
  )) {
    if (
      key === "parent" ||
      key === "loc" ||
      key === "range" ||
      key === "tokens" ||
      key === "comments"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNodeLike(item)) {
          out.push(item);
        }
      }

      continue;
    }

    if (isNodeLike(value)) {
      out.push(value);
    }
  }

  return out;
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
