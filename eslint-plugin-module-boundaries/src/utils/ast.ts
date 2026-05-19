import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

type UnknownRecord = Record<string, unknown>;

export function getDeclarationName(node: TSESTree.Node): string | undefined {
  if ("id" in node) {
    const id = node.id;

    if (isIdentifier(id)) {
      return id.name;
    }
  }

  return undefined;
}

export function getVariableDeclaratorName(
  declarator: TSESTree.VariableDeclarator
): string | undefined {
  return declarator.id.type === AST_NODE_TYPES.Identifier
    ? declarator.id.name
    : undefined;
}

export function unwrapExpression(
  expression: TSESTree.Expression
): TSESTree.Expression {
  let current = expression;

  while (isWrapperExpression(current)) {
    current = current.expression;
  }

  return current;
}

type WrapperExpression =
  | TSESTree.TSAsExpression
  | TSESTree.TSTypeAssertion
  | TSESTree.TSNonNullExpression
  | TSESTree.TSSatisfiesExpression
  | (TSESTree.Node & {
      readonly type: "TSInstantiationExpression";
      readonly expression: TSESTree.Expression;
    });

function isWrapperExpression(
  expression: TSESTree.Expression
): expression is WrapperExpression {
  return (
    expression.type === AST_NODE_TYPES.TSAsExpression ||
    expression.type === AST_NODE_TYPES.TSTypeAssertion ||
    expression.type === AST_NODE_TYPES.TSNonNullExpression ||
    expression.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    String(expression.type) === "TSInstantiationExpression"
  );
}

export function isAmbientDeclaration(node: TSESTree.Node): boolean {
  if ("declare" in node && node.declare === true) {
    return true;
  }

  return (
    node.type === AST_NODE_TYPES.TSModuleDeclaration &&
    (node.kind === "global" || node.declare === true)
  );
}

export function functionReturnsJsx(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
): boolean {
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    if (!node.expression && node.body.type === AST_NODE_TYPES.BlockStatement) {
      return blockReturnsJsx(node.body);
    }

    return containsJsx(node.body);
  }

  if (!node.body) {
    return false;
  }

  return blockReturnsJsx(node.body);
}

export function blockReturnsJsx(block: TSESTree.BlockStatement): boolean {
  return containsNode(block, (node) => {
    if (node.type !== AST_NODE_TYPES.ReturnStatement || !node.argument) {
      return false;
    }

    return containsJsx(node.argument);
  });
}

export function containsJsx(node: TSESTree.Node): boolean {
  return containsNode(
    node,
    (candidate) =>
      candidate.type === AST_NODE_TYPES.JSXElement ||
      candidate.type === AST_NODE_TYPES.JSXFragment
  );
}

export function containsNode(
  root: TSESTree.Node,
  predicate: (node: TSESTree.Node) => boolean
): boolean {
  const stack: TSESTree.Node[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    if (predicate(current)) {
      return true;
    }

    for (const [key, value] of Object.entries(current as unknown as UnknownRecord)) {
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

  return false;
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as UnknownRecord).type === "string"
  );
}

function isIdentifier(value: unknown): value is TSESTree.Identifier {
  return isNodeLike(value) && value.type === AST_NODE_TYPES.Identifier;
}
