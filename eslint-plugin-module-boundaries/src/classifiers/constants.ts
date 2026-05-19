import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { unwrapExpression } from "../utils/ast";

export function getConstantReason(
  expression: TSESTree.Expression | null
): string {
  if (!expression) {
    return "top-level variable declaration without initializer";
  }

  const unwrapped = unwrapExpression(expression);

  switch (unwrapped.type) {
    case AST_NODE_TYPES.Literal:
      return "literal runtime value";
    case AST_NODE_TYPES.ObjectExpression:
      return "object literal runtime value";
    case AST_NODE_TYPES.ArrayExpression:
      return "array literal runtime value";
    case AST_NODE_TYPES.TemplateLiteral:
      return "template literal runtime value";
    case AST_NODE_TYPES.CallExpression:
      return "computed top-level runtime value";
    default:
      return "top-level runtime value";
  }
}
