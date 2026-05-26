import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { isStoryFile } from "../utils/ast";

export const RULE_NAME = "no-jsx-computation";

export interface NoJsxComputationOptions {
  readonly allowSimpleTernary?: boolean;
}

type RuleOptions = [NoJsxComputationOptions];
type MessageIds = "noComputation" | "noChainedLogic";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowSimpleTernary: {
      type: "boolean"
    }
  }
};

const ARRAY_METHODS = ["map", "filter", "reduce", "sort", "find"];

export const noJsxComputationRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Move complex computations out of JSX into hooks or helper functions"
    },
    schema: [optionSchema],
    messages: {
      noComputation:
        "Extract this computation into a hook or helper function",
      noChainedLogic:
        "Complex logical expressions should be extracted into variables or hooks"
    }
  },
  defaultOptions: [{ allowSimpleTernary: true }],
  create(context, [options]) {
    const filename = context.filename;

    if (isStoryFile(filename)) {
      return {};
    }

    const allowSimpleTernary = options.allowSimpleTernary ?? true;

    return {
      "JSXExpressionContainer > CallExpression"(
        node: TSESTree.CallExpression
      ) {
        // Check for array methods like .map, .filter, etc
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const prop = node.callee.property;
          if (
            prop.type === AST_NODE_TYPES.Identifier &&
            ARRAY_METHODS.includes(prop.name)
          ) {
            context.report({
              node,
              messageId: "noComputation"
            });
          }
        }
      },
      "JSXExpressionContainer > ConditionalExpression"(
        node: TSESTree.ConditionalExpression
      ) {
        if (!allowSimpleTernary) {
          context.report({
            node,
            messageId: "noComputation"
          });
        }
      },
      "JSXExpressionContainer > LogicalExpression"(
        node: TSESTree.LogicalExpression
      ) {
        // Count depth of logical operators
        let depth = 0;
        let current: TSESTree.Node = node;
        while (
          current.type === AST_NODE_TYPES.LogicalExpression
        ) {
          depth++;
          current = current.left;
        }
        if (depth > 1) {
          context.report({
            node,
            messageId: "noChainedLogic"
          });
        }
      },
      "JSXExpressionContainer > BinaryExpression"(
        node: TSESTree.BinaryExpression
      ) {
        // Flag arithmetic and some operators
        if (["+", "-", "*", "/"].includes(node.operator)) {
          context.report({
            node,
            messageId: "noComputation"
          });
        }
      }
    };
  }
});
