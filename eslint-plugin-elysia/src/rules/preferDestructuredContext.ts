import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  collectElysiaVariables,
  getRouteHandlerFunction,
  isElysiaRouteCall,
} from "../utils/elysiaChain";

export const RULE_NAME = "prefer-destructured-context";

export interface PreferDestructuredContextOptions {
  readonly allowNames?: readonly string[];
}

type RuleOptions = [PreferDestructuredContextOptions];
type MessageIds = "preferDestructuredContext";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
    },
  },
};

export const preferDestructuredContextRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer destructured context (`{ body, set, ... }`) over passing the entire dynamic Elysia context object into controllers/services.",
      recommended: true,
    },
    schema: [optionSchema],
    messages: {
      preferDestructuredContext:
        "Do not pass the full Elysia context (`{{name}}`) into another function. Destructure only the properties you need at the route boundary.",
    },
  },
  defaultOptions: [{ allowNames: [] }],
  create(context, [options]) {
    const allowNames = new Set(options.allowNames ?? []);
    let elysiaVars = new Set<string>();

    return {
      Program(program) {
        elysiaVars = collectElysiaVariables(program);
      },
      CallExpression(node) {
        if (!isElysiaRouteCall(node, elysiaVars)) {
          return;
        }

        const handler = getRouteHandlerFunction(node);

        if (!handler) {
          return;
        }

        if (handler.params.length !== 1) {
          return;
        }

        const param = handler.params[0];

        if (!param || param.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (allowNames.has(param.name)) {
          return;
        }

        const ctxName = param.name;
        const violations: TSESTree.Node[] = [];

        collectContextPassThrough(handler.body, ctxName, violations);

        for (const violation of violations) {
          context.report({
            node: violation,
            messageId: "preferDestructuredContext",
            data: { name: ctxName },
          });
        }
      },
    };
  },
});

function collectContextPassThrough(
  root: TSESTree.Node,
  ctxName: string,
  violations: TSESTree.Node[],
): void {
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current as object)) {
      continue;
    }

    visited.add(current as object);

    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      if (current !== root) {
        continue;
      }
    }

    if (
      current.type === AST_NODE_TYPES.CallExpression ||
      current.type === AST_NODE_TYPES.NewExpression
    ) {
      for (const arg of current.arguments) {
        if (arg.type === AST_NODE_TYPES.Identifier && arg.name === ctxName) {
          violations.push(current);
          break;
        }

        if (
          arg.type === AST_NODE_TYPES.SpreadElement &&
          arg.argument.type === AST_NODE_TYPES.Identifier &&
          arg.argument.name === ctxName
        ) {
          violations.push(current);
          break;
        }
      }
    }

    for (const [key, value] of Object.entries(
      current as unknown as Record<string, unknown>,
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
            stack.push(item);
          }
        }

        continue;
      }

      if (isNodeLike(value)) {
        stack.push(value);
      }
    }
  }
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
