import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { getJsxAttributeName } from "../utils/ast";

export const RULE_NAME = "classnames-required";

export interface ClassnamesRequiredOptions {
  readonly allowedCallees?: readonly string[];
}

type RuleOptions = [ClassnamesRequiredOptions];
type MessageIds = "mustUseClassnames";

const DEFAULT_CALLEES = ["classNames", "cn"];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowedCallees: {
      type: "array",
      items: { type: "string" }
    }
  }
};

export const classnamesRequiredRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Use classNames utility for dynamic className values"
    },
    schema: [optionSchema],
    messages: {
      mustUseClassnames:
        "Use classNames() for dynamic className values"
    }
  },
  defaultOptions: [{ allowedCallees: DEFAULT_CALLEES }],
  create(context, [options]) {
    const allowedCallees = new Set(
      options.allowedCallees ?? DEFAULT_CALLEES
    );

    return {
      JSXAttribute(node) {
        const attrName = getJsxAttributeName(node);
        if (attrName !== "className") {
          return;
        }

        const value = node.value;
        if (!value || value.type !== AST_NODE_TYPES.JSXExpressionContainer) {
          return;
        }

        const expr = value.expression;

        // ConditionalExpression and TemplateLiteral with interpolation need classNames
        if (expr.type === AST_NODE_TYPES.ConditionalExpression) {
          context.report({
            node: expr,
            messageId: "mustUseClassnames"
          });
          return;
        }

        if (expr.type === AST_NODE_TYPES.TemplateLiteral) {
          // Check if it has interpolations
          if (expr.expressions.length > 0) {
            context.report({
              node: expr,
              messageId: "mustUseClassnames"
            });
          }
          return;
        }
      }
    };
  }
});
