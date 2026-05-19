import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { DEFAULT_CACHE_NAMES, matchCacheCall } from "../utils/cache";

export const RULE_NAME = "cache-set-must-have-ttl";

export interface CacheSetMustHaveTtlOptions {
  readonly cacheNames?: readonly string[];
  readonly methods?: readonly string[];
  readonly ttlField?: string;
}

type RuleOptions = [CacheSetMustHaveTtlOptions];
type MessageIds = "missingTtl";

const DEFAULT_METHODS: readonly string[] = ["set"];
const DEFAULT_TTL_FIELD = "ttlSeconds";

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
    ttlField: { type: "string", minLength: 1 }
  }
};

function objectHasField(
  options: TSESTree.ObjectExpression,
  field: string
): boolean {
  for (const prop of options.properties) {
    if (prop.type === AST_NODE_TYPES.SpreadElement) {
      // Spread of external options object — be permissive.
      return true;
    }
    if (prop.type !== AST_NODE_TYPES.Property || prop.computed) {
      continue;
    }
    if (
      prop.key.type === AST_NODE_TYPES.Identifier &&
      prop.key.name === field
    ) {
      return true;
    }
    if (
      prop.key.type === AST_NODE_TYPES.Literal &&
      typeof prop.key.value === "string" &&
      prop.key.value === field
    ) {
      return true;
    }
  }
  return false;
}

export const cacheSetMustHaveTtlRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Cache `.set` calls without a TTL field — unbounded retention will eventually OOM Redis."
    },
    schema: [optionSchema],
    messages: {
      missingTtl:
        "{{cache}}.{{method}} without `{{ttlField}}` — unbounded retention will OOM Redis."
    }
  },
  defaultOptions: [
    {
      cacheNames: [...DEFAULT_CACHE_NAMES],
      methods: [...DEFAULT_METHODS],
      ttlField: DEFAULT_TTL_FIELD
    }
  ],
  create(context, [options]) {
    const cacheNames = new Set(options.cacheNames ?? DEFAULT_CACHE_NAMES);
    const methods = new Set(options.methods ?? DEFAULT_METHODS);
    const ttlField = options.ttlField ?? DEFAULT_TTL_FIELD;

    return {
      CallExpression(node) {
        const match = matchCacheCall(node, cacheNames, methods);
        if (match === null) {
          return;
        }
        const optionsArg = node.arguments[2];
        if (
          optionsArg === undefined ||
          optionsArg.type !== AST_NODE_TYPES.ObjectExpression
        ) {
          context.report({
            node,
            messageId: "missingTtl",
            data: {
              cache: match.cacheName,
              method: match.method,
              ttlField
            }
          });
          return;
        }
        if (!objectHasField(optionsArg, ttlField)) {
          context.report({
            node: optionsArg,
            messageId: "missingTtl",
            data: {
              cache: match.cacheName,
              method: match.method,
              ttlField
            }
          });
        }
      }
    };
  }
});
