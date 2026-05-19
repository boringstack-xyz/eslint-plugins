import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  collectElysiaVariables,
  getRouteMethod,
  getRouteOptionsObject,
  getRoutePathLiteral,
  isElysiaRouteCall
} from "../utils/elysiaChain";

export const RULE_NAME = "route-requires-schema";

export interface RouteRequiresSchemaOptions {
  readonly allowMethods?: readonly string[];
  readonly ignorePathPattern?: string;
  readonly schemaKeys?: readonly string[];
}

type RuleOptions = [RouteRequiresSchemaOptions];
type MessageIds = "missingSchema";

const DEFAULT_SCHEMA_KEYS = [
  "body",
  "query",
  "params",
  "response",
  "headers",
  "cookie"
] as const;

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowMethods: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    },
    ignorePathPattern: { type: "string" },
    schemaKeys: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    }
  }
};

export const routeRequiresSchemaRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every Elysia route handler to declare at least one of body/query/params/response/headers/cookie schema in its options.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingSchema:
        "Elysia {{method}} '{{path}}' has no schema — add at least one of {{keys}}."
    }
  },
  defaultOptions: [
    {
      allowMethods: [],
      schemaKeys: [...DEFAULT_SCHEMA_KEYS]
    }
  ],
  create(context, [options]) {
    const allowMethods = new Set(options.allowMethods ?? []);
    const schemaKeys = new Set(options.schemaKeys ?? DEFAULT_SCHEMA_KEYS);
    const ignorePattern = compileRegExp(options.ignorePathPattern);

    let elysiaVars = new Set<string>();

    return {
      Program(program) {
        elysiaVars = collectElysiaVariables(program);
      },
      CallExpression(node) {
        if (!isElysiaRouteCall(node, elysiaVars)) {
          return;
        }

        const method = getRouteMethod(node);

        if (!method || allowMethods.has(method)) {
          return;
        }

        const path = getRoutePathLiteral(node);

        if (path && ignorePattern && ignorePattern.test(path)) {
          return;
        }

        const opts = getRouteOptionsObject(node);

        if (opts && hasAnySchemaKey(opts, schemaKeys)) {
          return;
        }

        context.report({
          node,
          messageId: "missingSchema",
          data: {
            method: method.toUpperCase(),
            path: path ?? "<dynamic>",
            keys: [...schemaKeys].join("/")
          }
        });
      }
    };
  }
});

function hasAnySchemaKey(
  obj: TSESTree.ObjectExpression,
  schemaKeys: ReadonlySet<string>
): boolean {
  for (const property of obj.properties) {
    if (property.type !== AST_NODE_TYPES.Property) {
      continue;
    }

    if (
      property.key.type === AST_NODE_TYPES.Identifier &&
      schemaKeys.has(property.key.name)
    ) {
      return true;
    }

    if (
      property.key.type === AST_NODE_TYPES.Literal &&
      typeof property.key.value === "string" &&
      schemaKeys.has(property.key.value)
    ) {
      return true;
    }
  }

  return false;
}

function compileRegExp(pattern: string | undefined): RegExp | null {
  if (!pattern) {
    return null;
  }

  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}
