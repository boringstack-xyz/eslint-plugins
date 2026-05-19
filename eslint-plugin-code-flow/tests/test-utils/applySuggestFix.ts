import * as parser from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import {
  buildGuardClauseReplacement,
  findWrappedHappyPathIf,
  getFunctionBlockBody
} from "../../src/utils/preferEarlyReturn";

function visitFunctions(
  node: TSESTree.Node,
  visitor: (
    fn:
      | TSESTree.FunctionDeclaration
      | TSESTree.FunctionExpression
      | TSESTree.ArrowFunctionExpression
  ) => void
): void {
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    visitor(node);
  }

  for (const key of Object.keys(node)) {
    const child = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        if (item !== null && typeof item === "object" && "type" in item) {
          visitFunctions(item as TSESTree.Node, visitor);
        }
      }
    } else if (child !== null && typeof child === "object" && "type" in child) {
      visitFunctions(child as TSESTree.Node, visitor);
    }
  }
}

export function applySuggestFix(code: string): string {
  const sourceCode = {
    ast: parser.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module"
    }),
    getText(node: { range?: [number, number] }): string {
      if (node.range === undefined) {
        return "";
      }
      return code.slice(node.range[0], node.range[1]);
    }
  };

  let updated = code;

  visitFunctions(sourceCode.ast, (fn) => {
    const body = getFunctionBlockBody(fn);

    if (body === null) {
      return;
    }

    const wrappedIf = findWrappedHappyPathIf(body);

    if (wrappedIf === null) {
      return;
    }

    const replacement = buildGuardClauseReplacement(sourceCode as never, wrappedIf);

    if (replacement === null || wrappedIf.range === undefined) {
      return;
    }

    updated =
      updated.slice(0, wrappedIf.range[0]) +
      replacement +
      updated.slice(wrappedIf.range[1]);
  });

  return updated;
}

export function preferEarlyReturnErrors(code: string, expectedCount = 1) {
  return Array.from({ length: expectedCount }, () => ({
    messageId: "preferEarlyReturn" as const,
    suggestions: [
      {
        messageId: "preferEarlyReturn" as const,
        output: applySuggestFix(code)
      }
    ]
  }));
}
