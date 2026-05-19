import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

type UnknownRecord = Record<string, unknown>;

const SCHEMA_BUILDER_IDENTIFIERS = new Set([
  "pgTable",
  "pgSchema",
  "relations",
  "foreignKey",
  "primaryKey",
  "index",
  "unique"
]);

export function isPgTableCall(node: TSESTree.CallExpression): boolean {
  return matchesCalleeIdentifier(node, "pgTable") || isMemberPropertyCall(node, "table");
}

export function isRelationsCall(node: TSESTree.CallExpression): boolean {
  return matchesCalleeIdentifier(node, "relations");
}

export function isForeignKeyCall(node: TSESTree.CallExpression): boolean {
  return matchesCalleeIdentifier(node, "foreignKey");
}

export function isSchemaBuilderCall(node: TSESTree.CallExpression): boolean {
  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    SCHEMA_BUILDER_IDENTIFIERS.has(node.callee.name)
  ) {
    return true;
  }

  return isMemberPropertyCall(node, "table");
}

export function getCalleeName(node: TSESTree.CallExpression): string | null {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    if (node.callee.object.type === AST_NODE_TYPES.Identifier) {
      return `${node.callee.object.name}.${node.callee.property.name}`;
    }

    return node.callee.property.name;
  }

  return null;
}

export function findCallExpressionsDeep(
  root: TSESTree.Node,
  predicate: (call: TSESTree.CallExpression) => boolean
): TSESTree.CallExpression[] {
  const matches: TSESTree.CallExpression[] = [];
  const stack: TSESTree.Node[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    if (current.type === AST_NODE_TYPES.CallExpression && predicate(current)) {
      matches.push(current);
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

  return matches;
}

function matchesCalleeIdentifier(
  node: TSESTree.CallExpression,
  name: string
): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === name
  );
}

function isMemberPropertyCall(
  node: TSESTree.CallExpression,
  propertyName: string
): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === propertyName
  );
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as UnknownRecord).type === "string"
  );
}
