import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import type { NormalizedOptions } from "../utils/config";
import { containsNode } from "../utils/ast";

export function isHookName(
  name: string | undefined,
  options: NormalizedOptions
): boolean {
  if (!options.hookDetection.enabled || !name) {
    return false;
  }

  return options.hookDetection.namePattern.test(name);
}

export function containsHookCall(
  node: TSESTree.Node,
  options: NormalizedOptions
): boolean {
  if (!options.hookDetection.enabled) {
    return false;
  }

  return containsNode(node, (candidate) => {
    if (candidate.type !== AST_NODE_TYPES.CallExpression) {
      return false;
    }

    const callee = candidate.callee;

    if (callee.type === AST_NODE_TYPES.Identifier) {
      return isHookName(callee.name, options);
    }

    if (
      callee.type === AST_NODE_TYPES.MemberExpression &&
      callee.property.type === AST_NODE_TYPES.Identifier
    ) {
      return isHookName(callee.property.name, options);
    }

    return false;
  });
}
