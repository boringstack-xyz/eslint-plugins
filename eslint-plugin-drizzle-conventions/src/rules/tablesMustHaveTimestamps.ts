import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { isPgTableCall } from "../utils/drizzle";

export const RULE_NAME = "tables-must-have-timestamps";

export interface TablesMustHaveTimestampsOptions {
  readonly requireColumns?: readonly string[];
  readonly requireOnUpdate?: readonly string[];
  readonly ignoreTablePattern?: string;
}

type RuleOptions = [TablesMustHaveTimestampsOptions];
type MessageIds = "missingTimestamp" | "missingOnUpdate";

// `createdAt` only by default. `updatedAt` is intentionally NOT required
// out of the box because junction tables, append-only audit logs, and
// short-lived token tables (verification, password-reset) legitimately
// don't have a row-update lifecycle. Opt in via the `requireColumns`
// option when your domain truly does need it everywhere.
const DEFAULT_REQUIRE_COLUMNS = ["createdAt"] as const;
const DEFAULT_REQUIRE_ON_UPDATE: readonly string[] = [];
const ON_UPDATE_METHODS = new Set(["$onUpdate", "$onUpdateFn"]);

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    requireColumns: {
      type: "array",
      items: {
        type: "string"
      },
      uniqueItems: true
    },
    requireOnUpdate: {
      type: "array",
      items: {
        type: "string"
      },
      uniqueItems: true
    },
    ignoreTablePattern: {
      type: "string"
    }
  }
};

export const tablesMustHaveTimestampsRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require Drizzle tables to declare standard timestamp columns (createdAt, updatedAt by default), and optionally require .$onUpdate() on auto-updating columns.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingTimestamp:
        "Table '{{name}}' missing required column(s): {{missing}}.",
      missingOnUpdate:
        "Column '{{column}}' on table '{{name}}' is in `requireOnUpdate` but its `timestamp(...)` chain does not include `.$onUpdate(...)` — without it, the column will not auto-update on row mutations."
    }
  },
  defaultOptions: [
    {
      requireColumns: [...DEFAULT_REQUIRE_COLUMNS],
      requireOnUpdate: [...DEFAULT_REQUIRE_ON_UPDATE]
    }
  ],
  create(context, [options]) {
    const requireColumns = options.requireColumns ?? DEFAULT_REQUIRE_COLUMNS;
    const requireOnUpdate = options.requireOnUpdate ?? DEFAULT_REQUIRE_ON_UPDATE;
    const ignorePattern = compilePattern(options.ignoreTablePattern);

    return {
      VariableDeclarator(node) {
        if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        if (!isPgTableCall(node.init)) {
          return;
        }

        const tableName = getTableName(node);

        if (!tableName) {
          return;
        }

        if (ignorePattern && ignorePattern.test(tableName)) {
          return;
        }

        const columnsArg = node.init.arguments[1];

        const definedColumns =
          columnsArg && columnsArg.type === AST_NODE_TYPES.ObjectExpression
            ? columnsArg
            : null;

        const reportNode = node.id.type === AST_NODE_TYPES.Identifier ? node.id : node;

        if (requireColumns.length > 0) {
          const missing = requireColumns.filter(
            (column) => !hasTimestampColumn(definedColumns, column)
          );

          if (missing.length > 0) {
            context.report({
              node: reportNode,
              messageId: "missingTimestamp",
              data: {
                name: tableName,
                missing: missing.join(", ")
              }
            });
          }
        }

        if (requireOnUpdate.length > 0 && definedColumns) {
          for (const column of requireOnUpdate) {
            const property = findTimestampProperty(definedColumns, column);

            if (!property) {
              continue;
            }

            if (
              property.value.type === AST_NODE_TYPES.CallExpression &&
              !chainHasOnUpdate(property.value)
            ) {
              context.report({
                node: property,
                messageId: "missingOnUpdate",
                data: {
                  name: tableName,
                  column
                }
              });
            }
          }
        }
      }
    };
  }
});

function compilePattern(source: string | undefined): RegExp | null {
  if (!source) {
    return null;
  }

  try {
    return new RegExp(source);
  } catch {
    return null;
  }
}

function getTableName(node: TSESTree.VariableDeclarator): string | null {
  if (node.id.type === AST_NODE_TYPES.Identifier) {
    return node.id.name;
  }

  if (node.init?.type === AST_NODE_TYPES.CallExpression) {
    const firstArg = node.init.arguments[0];

    if (
      firstArg &&
      firstArg.type === AST_NODE_TYPES.Literal &&
      typeof firstArg.value === "string"
    ) {
      return firstArg.value;
    }
  }

  return null;
}

function findTimestampProperty(
  columns: TSESTree.ObjectExpression,
  columnName: string
): TSESTree.Property | null {
  for (const property of columns.properties) {
    if (property.type !== AST_NODE_TYPES.Property) {
      continue;
    }

    if (!matchesPropertyKey(property, columnName)) {
      continue;
    }

    if (
      property.value.type === AST_NODE_TYPES.CallExpression &&
      isTimestampInitializer(property.value)
    ) {
      return property;
    }
  }

  return null;
}

function hasTimestampColumn(
  columns: TSESTree.ObjectExpression | null,
  columnName: string
): boolean {
  if (!columns) {
    return false;
  }

  return findTimestampProperty(columns, columnName) !== null;
}

function isTimestampInitializer(node: TSESTree.CallExpression): boolean {
  let current: TSESTree.Expression = node;

  while (
    current.type === AST_NODE_TYPES.CallExpression ||
    current.type === AST_NODE_TYPES.MemberExpression
  ) {
    if (current.type === AST_NODE_TYPES.CallExpression) {
      if (isTimestampCall(current)) {
        return true;
      }

      current = current.callee as TSESTree.Expression;
      continue;
    }

    current = current.object as TSESTree.Expression;
  }

  return false;
}

function chainHasOnUpdate(node: TSESTree.CallExpression): boolean {
  let current: TSESTree.Expression = node;

  while (
    current.type === AST_NODE_TYPES.CallExpression ||
    current.type === AST_NODE_TYPES.MemberExpression
  ) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.MemberExpression &&
      current.callee.property.type === AST_NODE_TYPES.Identifier &&
      ON_UPDATE_METHODS.has(current.callee.property.name)
    ) {
      return true;
    }

    if (current.type === AST_NODE_TYPES.CallExpression) {
      current = current.callee as TSESTree.Expression;
      continue;
    }

    current = current.object as TSESTree.Expression;
  }

  return false;
}

function matchesPropertyKey(
  property: TSESTree.Property,
  expected: string
): boolean {
  if (
    property.key.type === AST_NODE_TYPES.Identifier &&
    property.key.name === expected
  ) {
    return true;
  }

  if (
    property.key.type === AST_NODE_TYPES.Literal &&
    typeof property.key.value === "string" &&
    property.key.value === expected
  ) {
    return true;
  }

  return false;
}

function isTimestampCall(node: TSESTree.CallExpression): boolean {
  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "timestamp"
  ) {
    return true;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "timestamp"
  ) {
    return true;
  }

  return false;
}
