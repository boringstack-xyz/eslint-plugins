import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  collectElysiaVariables,
  findObjectProperty,
  getRouteMethod,
  getRouteOptionsObject,
  getRoutePathLiteral,
  isElysiaRouteCall
} from "../utils/elysiaChain";

export const RULE_NAME = "route-requires-tag";

export interface RouteRequiresTagOptions {
  readonly ignorePathPattern?: string;
}

type RuleOptions = [RouteRequiresTagOptions];
type MessageIds = "missingTag";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    ignorePathPattern: { type: "string" }
  }
};

export const routeRequiresTagRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require every Elysia route to declare detail.tags for Swagger grouping.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingTag:
        "Elysia {{method}} '{{path}}' is missing detail.tags — add a non-empty `detail: { tags: [...] }` for Swagger grouping."
    }
  },
  defaultOptions: [{}],
  create(context, [options]) {
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

        if (!method) {
          return;
        }

        const path = getRoutePathLiteral(node);

        if (path && ignorePattern && ignorePattern.test(path)) {
          return;
        }

        const opts = getRouteOptionsObject(node);

        if (opts && hasNonEmptyTags(opts)) {
          return;
        }

        context.report({
          node,
          messageId: "missingTag",
          data: {
            method: method.toUpperCase(),
            path: path ?? "<dynamic>"
          }
        });
      }
    };
  }
});

function hasNonEmptyTags(opts: ReturnType<typeof getRouteOptionsObject>): boolean {
  if (!opts) {
    return false;
  }

  const detail = findObjectProperty(opts, "detail");

  if (!detail || detail.value.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  const tags = findObjectProperty(detail.value, "tags");

  if (!tags || tags.value.type !== AST_NODE_TYPES.ArrayExpression) {
    return false;
  }

  return tags.value.elements.length > 0;
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
