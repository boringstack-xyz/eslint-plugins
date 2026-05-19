import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  DEFAULT_CONSTRUCT_EVENT_NAMES,
  isConstructEventCall,
  isStripeSignatureHeaderAccess,
  isWhsecLiteral
} from "../utils/stripe";

export const RULE_NAME = "require-stripe-signature-header";

export interface RequireStripeSignatureHeaderOptions {
  readonly allowedHeaderNames?: readonly string[];
  readonly constructEventNames?: readonly string[];
  /**
   * Regex source patterns identifying verifier method names. When the
   * `constructEvent(...)` call is inside a function whose name matches
   * one of these, a parameter passed as the signature arg is accepted —
   * the trust shifts to the caller. Pair with the
   * `service-must-construct-event` rule (which ensures callers exist)
   * and the `handler-must-verify-signature` rule (which ensures callers
   * pass the actual header).
   *
   * Default matches the canonical names: `constructWebhookEvent`,
   * `verifyWebhook`, `verifyWebhookEvent`, `verifyStripeWebhook`.
   */
  readonly verifierMethodPatterns?: readonly string[];
}

type RuleOptions = [RequireStripeSignatureHeaderOptions];
type MessageIds = "invalidSignatureSource" | "hardcodedWebhookSecret";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowedHeaderNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    constructEventNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    verifierMethodPatterns: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  }
};

const DEFAULT_VERIFIER_PATTERNS: readonly string[] = [
  "^constructWebhookEvent$",
  "^verifyWebhook(?:Event)?$",
  "^verifyStripeWebhook$"
];

export const requireStripeSignatureHeaderRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require the signature passed into `*.constructEvent(...)` to come from the Stripe-signature request header, and forbid hard-coded `whsec_*` secrets in source.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      invalidSignatureSource:
        "The 2nd argument to `constructEvent(...)` must come from the request's `stripe-signature` header (e.g. `request.headers.get('stripe-signature')` or `req.headers['stripe-signature']`). Forged events otherwise pass verification.",
      hardcodedWebhookSecret:
        "Hard-coded webhook secret (`whsec_*`). Read this from a secrets manager or environment variable instead — committing it to source leaks the verification key."
    }
  },
  defaultOptions: [
    {
      allowedHeaderNames: ["stripe-signature"],
      constructEventNames: ["constructEvent"],
      verifierMethodPatterns: [...DEFAULT_VERIFIER_PATTERNS]
    }
  ],
  create(context, [options]) {
    const allowedHeaderNames = new Set(
      (options.allowedHeaderNames ?? ["stripe-signature"]).map((name) =>
        name.toLowerCase()
      )
    );
    const constructEventNames = new Set(
      options.constructEventNames ?? DEFAULT_CONSTRUCT_EVENT_NAMES
    );
    const verifierPatterns = (
      options.verifierMethodPatterns ?? DEFAULT_VERIFIER_PATTERNS
    ).map(compileRegex);

    const signatureBindings = new Set<string>();

    return {
      VariableDeclarator(node) {
        if (node.id.type !== AST_NODE_TYPES.Identifier || !node.init) {
          return;
        }

        if (isValidSignatureSource(node.init, allowedHeaderNames, signatureBindings)) {
          signatureBindings.add(node.id.name);
        }
      },
      CallExpression(node) {
        if (!isConstructEventCall(node, constructEventNames)) {
          return;
        }

        const sig = node.arguments[1];

        if (!sig) {
          return;
        }

        // Inside a verifier method, the signature is a parameter — the
        // header read happens at the caller. Trust shifts there; this
        // rule's other half (service-must-construct-event) ensures the
        // caller exists.
        if (
          sig.type === AST_NODE_TYPES.Identifier &&
          isInsideVerifierMethod(node, sig.name, verifierPatterns)
        ) {
          return;
        }

        if (!isValidSignatureSource(sig, allowedHeaderNames, signatureBindings)) {
          context.report({ node: sig, messageId: "invalidSignatureSource" });
        }
      },
      Literal(node) {
        if (isWhsecLiteral(node)) {
          context.report({ node, messageId: "hardcodedWebhookSecret" });
        }
      }
    };
  }
});

function isValidSignatureSource(
  node: TSESTree.Node,
  allowedHeaderNames: ReadonlySet<string>,
  signatureBindings: ReadonlySet<string>
): boolean {
  if (isStripeSignatureHeaderAccess(node, allowedHeaderNames)) {
    return true;
  }

  if (
    node.type === AST_NODE_TYPES.LogicalExpression &&
    (node.operator === "??" || node.operator === "||")
  ) {
    return (
      isValidSignatureSource(node.left, allowedHeaderNames, signatureBindings) ||
      isValidSignatureSource(node.right, allowedHeaderNames, signatureBindings)
    );
  }

  if (
    node.type === AST_NODE_TYPES.AssignmentExpression &&
    isValidSignatureSource(node.right, allowedHeaderNames, signatureBindings)
  ) {
    return true;
  }

  if (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSNonNullExpression ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression
  ) {
    return isValidSignatureSource(
      node.expression,
      allowedHeaderNames,
      signatureBindings
    );
  }

  if (
    node.type === AST_NODE_TYPES.Identifier &&
    signatureBindings.has(node.name)
  ) {
    return true;
  }

  return false;
}

function compileRegex(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch {
    return /(?!)/; // matches nothing
  }
}

function getEnclosingFunctionName(
  node: TSESTree.Node
): { name: string; params: readonly TSESTree.Parameter[] } | null {
  let cursor: TSESTree.Node | undefined = node.parent;
  while (cursor) {
    if (
      cursor.type === AST_NODE_TYPES.FunctionDeclaration ||
      cursor.type === AST_NODE_TYPES.FunctionExpression
    ) {
      const id = cursor.id;
      if (id?.type === AST_NODE_TYPES.Identifier) {
        return { name: id.name, params: cursor.params };
      }
      // Method on a class / object — name is on the parent
      const parent = cursor.parent;
      if (
        parent?.type === AST_NODE_TYPES.MethodDefinition &&
        parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return { name: parent.key.name, params: cursor.params };
      }
      if (
        parent?.type === AST_NODE_TYPES.Property &&
        parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return { name: parent.key.name, params: cursor.params };
      }
    }
    if (cursor.type === AST_NODE_TYPES.ArrowFunctionExpression) {
      const parent = cursor.parent;
      if (
        parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        parent.id.type === AST_NODE_TYPES.Identifier
      ) {
        return { name: parent.id.name, params: cursor.params };
      }
      if (
        parent?.type === AST_NODE_TYPES.PropertyDefinition &&
        parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return { name: parent.key.name, params: cursor.params };
      }
    }
    cursor = cursor.parent;
  }
  return null;
}

function isInsideVerifierMethod(
  node: TSESTree.Node,
  paramName: string,
  patterns: readonly RegExp[]
): boolean {
  const enclosing = getEnclosingFunctionName(node);
  if (!enclosing) {
    return false;
  }
  if (!patterns.some((p) => p.test(enclosing.name))) {
    return false;
  }
  return enclosing.params.some((param) => {
    const target =
      param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;
    return (
      target.type === AST_NODE_TYPES.Identifier && target.name === paramName
    );
  });
}
