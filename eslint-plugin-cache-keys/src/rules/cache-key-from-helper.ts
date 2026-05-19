import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { DEFAULT_CACHE_NAMES, matchCacheCall } from "../utils/cache";

export const RULE_NAME = "cache-key-from-helper";

export interface CacheKeyFromHelperOptions {
  readonly cacheNames?: readonly string[];
  readonly methods?: readonly string[];
  readonly helperNames?: readonly string[];
}

type RuleOptions = [CacheKeyFromHelperOptions];
type MessageIds = "keyNotFromHelper";

const DEFAULT_METHODS: readonly string[] = [
  "set",
  "get",
  "del",
  "has",
  "wrap"
];

const DEFAULT_HELPER_NAMES: readonly string[] = [];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    cacheNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    methods: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    helperNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  }
};

function getCalleeName(node: TSESTree.CallExpression): string | null {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name;
  }
  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    !node.callee.computed &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name;
  }
  return null;
}

export const cacheKeyFromHelperRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Cache keys must be built by a configured helper function — forces a single source of truth and prevents inline string drift."
    },
    schema: [optionSchema],
    messages: {
      keyNotFromHelper:
        "Cache key must be built by a configured helper function ({{helpers}}), not constructed inline."
    }
  },
  defaultOptions: [
    {
      cacheNames: [...DEFAULT_CACHE_NAMES],
      methods: [...DEFAULT_METHODS],
      helperNames: [...DEFAULT_HELPER_NAMES]
    }
  ],
  create(context, [options]) {
    const cacheNames = new Set(options.cacheNames ?? DEFAULT_CACHE_NAMES);
    const methods = new Set(options.methods ?? DEFAULT_METHODS);
    const helperNames = options.helperNames ?? DEFAULT_HELPER_NAMES;

    if (helperNames.length === 0) {
      // Opt-in rule — no helpers configured means rule is a no-op.
      return {};
    }

    const allowed = new Set(helperNames);

    return {
      CallExpression(node) {
        const match = matchCacheCall(node, cacheNames, methods);
        if (match === null) {
          return;
        }
        const keyArg = node.arguments[0];
        if (keyArg === undefined) {
          return;
        }
        if (keyArg.type === AST_NODE_TYPES.CallExpression) {
          const helper = getCalleeName(keyArg);
          if (helper !== null && allowed.has(helper)) {
            return;
          }
        }
        context.report({
          node: keyArg,
          messageId: "keyNotFromHelper",
          data: { helpers: helperNames.join(", ") }
        });
      }
    };
  }
});
