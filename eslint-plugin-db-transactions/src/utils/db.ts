import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

export const DEFAULT_DB_NAMES: readonly string[] = ["db"];

export const DEFAULT_WRITE_METHODS: readonly string[] = [
  "insert",
  "update",
  "delete",
  "upsert",
  "execute"
];

export const DEFAULT_TRANSACTION_METHOD = "transaction";

/**
 * Returns the leftmost identifier name in a (possibly chained)
 * MemberExpression. `db.insert(...).values(...)` → "db".
 */
export function getRootIdentifierName(
  node: TSESTree.Node
): string | null {
  let current: TSESTree.Node = node;
  while (current.type === AST_NODE_TYPES.MemberExpression) {
    current = current.object;
  }
  if (current.type === AST_NODE_TYPES.Identifier) {
    return current.name;
  }
  if (current.type === AST_NODE_TYPES.CallExpression) {
    return getRootIdentifierName(current.callee);
  }
  return null;
}

/**
 * If `node` is `<id>.<method>(...)` where `<id>` is a configured DB name and
 * `<method>` is in `methods`, returns the DB name + method. Walks chained
 * member expressions so `db.insert(...).values(...).returning()` resolves to
 * `db` + `insert`.
 */
export function matchDbMethodCall(
  node: TSESTree.CallExpression,
  dbNames: ReadonlySet<string>,
  methods: ReadonlySet<string>
): { dbName: string; method: string } | null {
  // Walk callee chain to find the first MemberExpression rooted at a DB
  // identifier with a matching method.
  let callee: TSESTree.Node = node.callee;
  while (callee.type === AST_NODE_TYPES.MemberExpression) {
    if (
      !callee.computed &&
      callee.property.type === AST_NODE_TYPES.Identifier &&
      methods.has(callee.property.name)
    ) {
      const root = getRootIdentifierName(callee.object);
      if (root !== null && dbNames.has(root)) {
        return { dbName: root, method: callee.property.name };
      }
    }
    callee = callee.object;
  }
  return null;
}

/**
 * Returns the callback argument when `node` is a transaction call:
 *   `<id>.transaction(<callback>)` where `<id>` ∈ dbNames.
 * Returns null otherwise.
 */
export function matchTransactionCall(
  node: TSESTree.CallExpression,
  dbNames: ReadonlySet<string>,
  transactionMethod: string
): {
  dbName: string;
  callback: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
} | null {
  const callee = node.callee;
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) {
    return null;
  }
  if (
    callee.property.type !== AST_NODE_TYPES.Identifier ||
    callee.property.name !== transactionMethod
  ) {
    return null;
  }
  if (callee.object.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }
  if (!dbNames.has(callee.object.name)) {
    return null;
  }
  const cb = node.arguments[0];
  if (
    cb === undefined ||
    (cb.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
      cb.type !== AST_NODE_TYPES.FunctionExpression)
  ) {
    return null;
  }
  return { dbName: callee.object.name, callback: cb };
}
