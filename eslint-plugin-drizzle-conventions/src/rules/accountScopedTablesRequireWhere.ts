import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { matchesAnyGlob } from "../utils/glob";

export const RULE_NAME = "account-scoped-tables-require-where";

export interface AccountScopedTablesOptions {
  readonly tables?: readonly string[];
  readonly scopeColumn?: string;
  readonly alternateScopeColumns?: readonly string[];
  readonly allowFiles?: readonly string[];
}

type RuleOptions = [AccountScopedTablesOptions];
type MessageIds = "missingScopeFilter";

const DEFAULT_SCOPE_COLUMN = "accountId";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    tables: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    scopeColumn: { type: "string", minLength: 1 },
    alternateScopeColumns: {
      type: "array",
      items: { type: "string", minLength: 1 },
      uniqueItems: true
    },
    allowFiles: {
      type: "array",
      items: { type: "string", minLength: 1 },
      uniqueItems: true
    }
  }
};

/**
 * Every Drizzle query against a configured account-scoped table must
 * filter/scope on the configured scope column (default: `accountId`).
 *
 * - `db.select().from(widgets)` and `db.update(widgets).set(...)` and
 *   `db.delete(widgets)` must chain a `.where(...)` whose argument tree
 *   mentions the scope column.
 * - `db.insert(widgets).values({...})` must include the scope column in
 *   its values object.
 * - `db.query.widgets.findFirst({ where: ... })` must reference the
 *   scope column in the `where` value.
 *
 * The rule does NOT understand `or(...)` semantics — if you scope with
 * accountId AND also pass tenant_id, both are mentioned and the rule
 * passes. False positives are unlikely; false negatives are possible
 * for obfuscated patterns (e.g. building the where outside the call
 * expression and passing it in by name). Such patterns are rare and
 * should be reviewed manually.
 */
export const accountScopedTablesRequireWhereRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every Drizzle query against an account-scoped table to filter by accountId.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingScopeFilter:
        "Drizzle query against account-scoped table `{{table}}` is missing a `{{scopeColumn}}` filter. Account-scoped queries must include `{{scopeColumn}}` in their WHERE / values / insert payload — otherwise data from other tenants leaks."
    }
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const tables = new Set(options.tables ?? []);
    const scopeColumn = options.scopeColumn ?? DEFAULT_SCOPE_COLUMN;
    const alternateScopeColumns = options.alternateScopeColumns ?? [];
    const allowFiles = options.allowFiles ?? [];

    if (tables.size === 0) {
      return {};
    }

    if (matchesAnyGlob(context.filename, allowFiles)) {
      return {};
    }

    /*
     * Some queries legitimately filter by an alternate column that
     * implies a unique row (e.g. `tokenHash` on invitations is
     * cryptographically unique, so the where clause doesn't need an
     * accountId predicate — the row IS the scope). Listing those
     * column names here turns "where mentions <alt>" into a pass.
     */
    const scopeColumns = [scopeColumn, ...alternateScopeColumns];

    return {
      CallExpression(node) {
        const queryShape = identifyQuery(node, tables);

        if (!queryShape) {
          return;
        }

        if (
          queryShape.kind === "from" ||
          queryShape.kind === "update" ||
          queryShape.kind === "delete"
        ) {
          if (chainContainsWhereWithAnyScope(node, scopeColumns)) {
            return;
          }
        } else if (queryShape.kind === "insert") {
          if (chainContainsValuesWithScope(node, scopeColumn)) {
            return;
          }
        } else if (queryShape.kind === "queryBuilder") {
          if (objectArgumentContainsAnyScope(node, scopeColumns)) {
            return;
          }
        }

        context.report({
          node,
          messageId: "missingScopeFilter",
          data: { table: queryShape.table, scopeColumn }
        });
      }
    };
  }
});

function chainContainsWhereWithAnyScope(
  startCall: TSESTree.CallExpression,
  scopeColumns: readonly string[]
): boolean {
  return scopeColumns.some((col) => chainContainsWhereWithScope(startCall, col));
}

function objectArgumentContainsAnyScope(
  node: TSESTree.CallExpression,
  scopeColumns: readonly string[]
): boolean {
  return scopeColumns.some((col) => objectArgumentContainsScope(node, col));
}

interface QueryShape {
  readonly kind: "from" | "insert" | "update" | "delete" | "queryBuilder";
  readonly table: string;
}

function identifyQuery(
  node: TSESTree.CallExpression,
  tables: Set<string>
): QueryShape | null {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }

  const property = node.callee.property;

  if (property.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }

  // db.select().from(<Table>)
  if (property.name === "from") {
    const arg = node.arguments[0];

    if (arg && arg.type === AST_NODE_TYPES.Identifier && tables.has(arg.name)) {
      return { kind: "from", table: arg.name };
    }
  }

  // db.insert(<Table>).values(...)
  if (property.name === "insert") {
    const arg = node.arguments[0];

    if (arg && arg.type === AST_NODE_TYPES.Identifier && tables.has(arg.name)) {
      return { kind: "insert", table: arg.name };
    }
  }

  // db.update(<Table>).set(...)
  if (property.name === "update") {
    const arg = node.arguments[0];

    if (arg && arg.type === AST_NODE_TYPES.Identifier && tables.has(arg.name)) {
      return { kind: "update", table: arg.name };
    }
  }

  // db.delete(<Table>)
  if (property.name === "delete") {
    const arg = node.arguments[0];

    if (arg && arg.type === AST_NODE_TYPES.Identifier && tables.has(arg.name)) {
      return { kind: "delete", table: arg.name };
    }
  }

  // db.query.<Table>.findFirst({where:...}) / .findMany({where:...})
  if (property.name === "findFirst" || property.name === "findMany") {
    const tableName = extractQueryBuilderTable(node);

    if (tableName !== null && tables.has(tableName)) {
      return { kind: "queryBuilder", table: tableName };
    }
  }

  return null;
}

function extractQueryBuilderTable(
  node: TSESTree.CallExpression
): string | null {
  // node.callee = MemberExpression: <something>.findFirst
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }

  const obj = node.callee.object;

  // obj should be MemberExpression: db.query.<Table>
  if (obj.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }

  if (obj.property.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }

  return obj.property.name;
}

function getParent(node: TSESTree.Node): TSESTree.Node | undefined {
  return (node as { parent?: TSESTree.Node }).parent;
}

function chainContainsWhereWithScope(
  startCall: TSESTree.CallExpression,
  scopeColumn: string
): boolean {
  // Walk UP the chain: from `.from(T)` we follow .where(...) calls that wrap us.
  let current: TSESTree.Node = startCall;
  let parent = getParent(current);

  while (parent !== undefined) {
    if (
      parent.type === AST_NODE_TYPES.MemberExpression &&
      parent.object === current &&
      parent.property.type === AST_NODE_TYPES.Identifier &&
      parent.property.name === "where"
    ) {
      const whereCall = getParent(parent);

      if (whereCall && whereCall.type === AST_NODE_TYPES.CallExpression) {
        const firstArg = whereCall.arguments[0];

        if (firstArg && subtreeReferencesIdentifier(firstArg, scopeColumn)) {
          return true;
        }
      }
    }

    if (
      parent.type === AST_NODE_TYPES.MemberExpression ||
      parent.type === AST_NODE_TYPES.CallExpression
    ) {
      current = parent;
      parent = getParent(current);

      continue;
    }

    break;
  }

  return false;
}

function chainContainsValuesWithScope(
  startCall: TSESTree.CallExpression,
  scopeColumn: string
): boolean {
  let current: TSESTree.Node = startCall;
  let parent = getParent(current);

  while (parent !== undefined) {
    if (
      parent.type === AST_NODE_TYPES.MemberExpression &&
      parent.object === current &&
      parent.property.type === AST_NODE_TYPES.Identifier &&
      parent.property.name === "values"
    ) {
      const valuesCall = getParent(parent);

      if (valuesCall && valuesCall.type === AST_NODE_TYPES.CallExpression) {
        const firstArg = valuesCall.arguments[0];

        if (firstArg && objectExpressionMentionsKey(firstArg, scopeColumn)) {
          return true;
        }

        if (firstArg && firstArg.type === AST_NODE_TYPES.ArrayExpression) {
          for (const element of firstArg.elements) {
            if (element && objectExpressionMentionsKey(element, scopeColumn)) {
              return true;
            }
          }
        }
      }
    }

    if (
      parent.type === AST_NODE_TYPES.MemberExpression ||
      parent.type === AST_NODE_TYPES.CallExpression
    ) {
      current = parent;
      parent = getParent(current);

      continue;
    }

    break;
  }

  return false;
}

function objectArgumentContainsScope(
  node: TSESTree.CallExpression,
  scopeColumn: string
): boolean {
  const arg = node.arguments[0];

  if (!arg || arg.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  for (const property of arg.properties) {
    if (
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      property.key.name === "where"
    ) {
      if (subtreeReferencesIdentifier(property.value, scopeColumn)) {
        return true;
      }
    }
  }

  return false;
}

function objectExpressionMentionsKey(
  node: TSESTree.Node,
  key: string
): boolean {
  if (node.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  for (const property of node.properties) {
    if (
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      property.key.name === key
    ) {
      return true;
    }

    if (property.type === AST_NODE_TYPES.SpreadElement) {
      // Spread (e.g. `...body`) might include accountId at runtime; we
      // can't statically verify. Treat as a soft pass.
      return true;
    }
  }

  return false;
}

const NON_AST_KEYS = new Set([
  "parent",
  "loc",
  "range",
  "tokens",
  "comments",
  "start",
  "end"
]);

function isAstNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in (value as { type?: unknown }) &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function subtreeReferencesIdentifier(
  root: TSESTree.Node,
  name: string
): boolean {
  let found = false;
  const visited = new WeakSet<object>();

  const visit = (node: TSESTree.Node): void => {
    if (found || visited.has(node)) {
      return;
    }

    visited.add(node);

    if (node.type === AST_NODE_TYPES.Identifier && node.name === name) {
      found = true;

      return;
    }

    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      node.property.name === name
    ) {
      found = true;

      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (found) {
        return;
      }

      if (NON_AST_KEYS.has(key)) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const child of value) {
          if (isAstNode(child)) {
            visit(child);

            if (found) {
              return;
            }
          }
        }
      } else if (isAstNode(value)) {
        visit(value);

        if (found) {
          return;
        }
      }
    }
  };

  visit(root);

  return found;
}
