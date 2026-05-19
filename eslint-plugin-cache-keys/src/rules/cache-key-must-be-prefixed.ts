import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { DEFAULT_CACHE_NAMES, matchCacheCall } from "../utils/cache";

export const RULE_NAME = "cache-key-must-be-prefixed";

export interface CacheKeyMustBePrefixedOptions {
  readonly cacheNames?: readonly string[];
  readonly methods?: readonly string[];
  readonly prefixes?: readonly string[];
}

type RuleOptions = [CacheKeyMustBePrefixedOptions];
type MessageIds = "missingKeyPrefix";

const DEFAULT_METHODS: readonly string[] = [
  "set",
  "get",
  "del",
  "has",
  "wrap"
];

const DEFAULT_PREFIXES: readonly string[] = [
  "cache:",
  "stripe:",
  "session:",
  "rate:",
  "oauth:"
];

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
    prefixes: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    }
  }
};

function startsWithAny(value: string, prefixes: readonly string[]): boolean {
  for (const p of prefixes) {
    if (value.startsWith(p)) {
      return true;
    }
  }
  return false;
}

function getKeyLeadingString(node: TSESTree.Node): string | null {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    const first = node.quasis[0];
    if (first === undefined) {
      return null;
    }
    return first.value.cooked ?? first.value.raw;
  }
  return null;
}

export const cacheKeyMustBePrefixedRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Cache keys must start with a configured namespace prefix — prevents collisions when multiple apps share a Redis instance."
    },
    schema: [optionSchema],
    messages: {
      missingKeyPrefix:
        "Cache key '{{key}}' must start with one of: {{prefixes}}."
    }
  },
  defaultOptions: [
    {
      cacheNames: [...DEFAULT_CACHE_NAMES],
      methods: [...DEFAULT_METHODS],
      prefixes: [...DEFAULT_PREFIXES]
    }
  ],
  create(context, [options]) {
    const cacheNames = new Set(options.cacheNames ?? DEFAULT_CACHE_NAMES);
    const methods = new Set(options.methods ?? DEFAULT_METHODS);
    const prefixes = options.prefixes ?? DEFAULT_PREFIXES;

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
        const lead = getKeyLeadingString(keyArg);
        if (lead === null) {
          // Identifier / call result / etc. — assumed built by a helper.
          return;
        }
        if (startsWithAny(lead, prefixes)) {
          return;
        }
        context.report({
          node: keyArg,
          messageId: "missingKeyPrefix",
          data: {
            key: lead,
            prefixes: prefixes.join(", ")
          }
        });
      }
    };
  }
});
