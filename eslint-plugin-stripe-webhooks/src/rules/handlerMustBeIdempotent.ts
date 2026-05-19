import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  analyzeStripeImports,
  getCalleeName,
  walkSome,
  type FunctionLike,
  type StripeImports
} from "../utils/stripe";

export const RULE_NAME = "handler-must-be-idempotent";

export interface HandlerMustBeIdempotentOptions {
  readonly allowedCheckFunctionPatterns?: readonly string[];
}

type RuleOptions = [HandlerMustBeIdempotentOptions];
type MessageIds = "missingIdempotency";

const DEFAULT_PATTERNS: readonly string[] = [
  "alreadyProcessed",
  "isProcessed",
  "ensureIdempotent",
  "hasProcessed",
  "dedupe"
];

const SIDE_EFFECT_METHODS = new Set([
  "insert",
  "update",
  "upsert",
  "delete",
  "create",
  "save",
  "publish",
  "send",
  "sendMail",
  "enqueue",
  "dispatch",
  "trigger"
]);

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowedCheckFunctionPatterns: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  }
};

export const handlerMustBeIdempotentRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Stripe may deliver the same event multiple times. Webhook handlers must consult `event.id` (via a dedupe check) before performing irreversible side effects.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingIdempotency:
        "Webhook handler performs side effects without an idempotency check on `event.id`. Stripe redelivers events on transient failures — call e.g. `await alreadyProcessed(event.id)` before any irreversible write."
    }
  },
  defaultOptions: [{ allowedCheckFunctionPatterns: [...DEFAULT_PATTERNS] }],
  create(context, [options]) {
    const patterns = options.allowedCheckFunctionPatterns ?? DEFAULT_PATTERNS;
    const patternRegexes = patterns.map(
      (p) => new RegExp(p, "i")
    );
    let imports: StripeImports = {
      hasStripeImport: false,
      defaultBindings: new Set(),
      namespaceBindings: new Set(),
      cjsBindings: new Set(),
      eventTypeAliases: new Set()
    };

    return {
      Program(program) {
        imports = analyzeStripeImports(program);
      },
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(
        node: FunctionLike
      ) {
        const eventName = getEventParamName(node, imports);

        if (!eventName) {
          return;
        }

        const sideEffects = collectSideEffects(node.body);

        if (sideEffects.length === 0) {
          return;
        }

        if (hasIdempotencyCheck(node.body, eventName, patternRegexes)) {
          return;
        }

        const target = sideEffects[0] ?? node;
        context.report({ node: target, messageId: "missingIdempotency" });
      }
    };
  }
});

function getEventParamName(
  node: FunctionLike,
  imports: StripeImports
): string | null {
  for (const param of node.params) {
    const target =
      param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;

    if (target.type !== AST_NODE_TYPES.Identifier) {
      continue;
    }

    if (
      target.typeAnnotation &&
      typeReferencesStripeEvent(target.typeAnnotation, imports.eventTypeAliases)
    ) {
      return target.name;
    }

    if (imports.hasStripeImport && target.name === "event") {
      return target.name;
    }
  }

  return null;
}

function typeReferencesStripeEvent(
  annotation: TSESTree.TSTypeAnnotation,
  eventAliases: ReadonlySet<string>
): boolean {
  return walkSome(annotation, (n) => {
    if (n.type !== AST_NODE_TYPES.TSTypeReference) {
      return false;
    }

    if (
      n.typeName.type === AST_NODE_TYPES.TSQualifiedName &&
      n.typeName.left.type === AST_NODE_TYPES.Identifier &&
      n.typeName.left.name === "Stripe" &&
      n.typeName.right.type === AST_NODE_TYPES.Identifier &&
      n.typeName.right.name === "Event"
    ) {
      return true;
    }

    if (
      n.typeName.type === AST_NODE_TYPES.Identifier &&
      eventAliases.has(n.typeName.name)
    ) {
      return true;
    }

    return false;
  });
}

function collectSideEffects(body: TSESTree.Node): TSESTree.CallExpression[] {
  const out: TSESTree.CallExpression[] = [];

  walkSome(body, (n) => {
    if (n.type !== AST_NODE_TYPES.CallExpression) {
      return false;
    }

    if (
      n.callee.type === AST_NODE_TYPES.MemberExpression &&
      n.callee.property.type === AST_NODE_TYPES.Identifier &&
      SIDE_EFFECT_METHODS.has(n.callee.property.name)
    ) {
      out.push(n);
    }

    return false;
  });

  return out;
}

function hasIdempotencyCheck(
  body: TSESTree.Node,
  eventName: string,
  patternRegexes: readonly RegExp[]
): boolean {
  return walkSome(body, (n) => {
    if (n.type !== AST_NODE_TYPES.CallExpression) {
      return false;
    }

    const callee = getCalleeName(n);

    if (!callee) {
      return false;
    }

    const last = callee.split(".").pop() ?? callee;

    if (patternRegexes.some((re) => re.test(last))) {
      return true;
    }

    if (
      n.callee.type === AST_NODE_TYPES.MemberExpression &&
      n.callee.property.type === AST_NODE_TYPES.Identifier
    ) {
      const method = n.callee.property.name;

      if (
        method.startsWith("find") ||
        method === "has" ||
        method === "includes" ||
        method === "exists"
      ) {
        if (callContainsEventId(n, eventName)) {
          return true;
        }
      }
    }

    return false;
  });
}

function callContainsEventId(
  call: TSESTree.CallExpression,
  eventName: string
): boolean {
  return walkSome(call, (n) => {
    if (
      n.type === AST_NODE_TYPES.MemberExpression &&
      n.object.type === AST_NODE_TYPES.Identifier &&
      n.object.name === eventName &&
      n.property.type === AST_NODE_TYPES.Identifier &&
      n.property.name === "id"
    ) {
      return true;
    }

    return false;
  });
}
