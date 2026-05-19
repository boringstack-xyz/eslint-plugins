import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  DEFAULT_CONSTRUCT_EVENT_NAMES,
  analyzeStripeImports,
  classifyParsedBody,
  fileMentionsConstructEvent,
  isConstructEventCall,
  type StripeImports
} from "../utils/stripe";

export const RULE_NAME = "no-parsed-body-before-verification";

export interface NoParsedBodyBeforeVerificationOptions {
  readonly constructEventNames?: readonly string[];
}

type RuleOptions = [NoParsedBodyBeforeVerificationOptions];
type MessageIds = "parsedBeforeVerification";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    constructEventNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    }
  }
};

export const noParsedBodyBeforeVerificationRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow parsed-body APIs (`request.json()`, `JSON.parse(body)`, `req.body.*`, `express.json()`) before `*.constructEvent(...)` — Stripe verification requires the raw body bytes.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      parsedBeforeVerification:
        "Parsed body ({{kind}}) used before signature verification — Stripe `constructEvent` needs the RAW body bytes. Use `request.text()` (Web Fetch) or your framework's raw-body equivalent."
    }
  },
  defaultOptions: [{ constructEventNames: ["constructEvent"] }],
  create(context, [options]) {
    const constructEventNames = new Set(
      options.constructEventNames ?? DEFAULT_CONSTRUCT_EVENT_NAMES
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

        if (!imports.hasStripeImport && !fileHasConstructEvent) {
          return;
        }

        analyzeProgram(program);
      }
    };

    function analyzeProgram(program: TSESTree.Program): void {
      const constructEventCalls: TSESTree.CallExpression[] = [];

      walkAll(program, (n) => {
        if (
          n.type === AST_NODE_TYPES.CallExpression &&
          isConstructEventCall(n, constructEventNames)
        ) {
          constructEventCalls.push(n);
        }
      });

      walkAll(program, (node) => {
        const parsed = classifyParsedBody(node);

        if (!parsed) {
          return;
        }

        const targetStart = parsed.node.range[0];

        const seenBefore = constructEventCalls.some(
          (c) => c.range[1] <= targetStart
        );

        if (seenBefore) {
          return;
        }

        context.report({
          node: parsed.node,
          messageId: "parsedBeforeVerification",
          data: { kind: parsed.kind }
        });
      });
    }
  }
});

function walkAll(
  root: TSESTree.Node,
  visit: (n: TSESTree.Node) => void
): void {
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current as object)) {
      continue;
    }

    visited.add(current as object);
    visit(current);

    for (const child of collectChildren(current)) {
      stack.push(child);
    }
  }
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
