import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { matchesAnyGlob } from "../utils/glob";

export const RULE_NAME = "no-raw-sql-outside-allowlist";

export interface NoRawSqlOutsideAllowlistOptions {
  readonly allowFiles?: readonly string[];
  /**
   * Allow `sql` templates whose literal text is only arithmetic around
   * interpolated column references, e.g. `sql\`${table.count} + 1\``, the
   * idiomatic atomic increment (default true).
   */
  readonly allowColumnArithmetic?: boolean;
}

type RuleOptions = [NoRawSqlOutsideAllowlistOptions];
type MessageIds = "noRawSql";

// Migrations are obvious. The other entries cover canonical legitimate
// uses of `sql\`...\``: connection probes (`SELECT 1`) live in health
// checks and test helpers, and many projects keep raw queries under a
// `raw/` folder by convention.
const DEFAULT_ALLOW_FILES = [
  "**/migrations/**",
  "**/raw/**",
  "**/health/**",
  "**/*.check.ts",
  "**/tests/**",
  "**/__tests__/**"
] as const;

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowFiles: {
      type: "array",
      items: {
        type: "string"
      },
      uniqueItems: true
    },
    allowColumnArithmetic: { type: "boolean" }
  }
};

const ARITHMETIC_TEXT = /^[\s\d.+\-*/%()]*$/u;

/**
 * `sql\`${col} + 1\`` carries no SQL of its own: the static text is operators
 * and numbers, every hole is a column reference drizzle renders itself. That
 * is the atomic counter every schema needs, not a hand-written query.
 */
function isColumnArithmetic(node: TSESTree.TaggedTemplateExpression): boolean {
  const { quasis, expressions } = node.quasi;

  if (expressions.length === 0) {
    return false;
  }

  if (
    !expressions.every(
      (expression) =>
        expression.type === AST_NODE_TYPES.Identifier ||
        expression.type === AST_NODE_TYPES.MemberExpression
    )
  ) {
    return false;
  }

  return quasis.every((quasi) =>
    ARITHMETIC_TEXT.test(quasi.value.cooked ?? quasi.value.raw)
  );
}

export const noRawSqlOutsideAllowlistRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow drizzle-orm `sql` tagged template literals outside an allowlist of files (migrations, raw queries); column arithmetic such as `${col} + 1` is allowed.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      noRawSql:
        "Raw `sql` template literals are not allowed outside the configured allowlist (migrations / raw)."
    }
  },
  defaultOptions: [
    { allowFiles: [...DEFAULT_ALLOW_FILES], allowColumnArithmetic: true }
  ],
  create(context, [options]) {
    const allowFiles = options.allowFiles ?? DEFAULT_ALLOW_FILES;
    const allowColumnArithmetic = options.allowColumnArithmetic ?? true;

    if (matchesAnyGlob(context.filename, allowFiles)) {
      return {};
    }

    const sqlBindings = new Set<string>();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "drizzle-orm") {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
            continue;
          }

          if (
            specifier.imported.type === AST_NODE_TYPES.Identifier &&
            specifier.imported.name === "sql"
          ) {
            sqlBindings.add(specifier.local.name);
          }
        }
      },
      TaggedTemplateExpression(node) {
        if (node.tag.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (!sqlBindings.has(node.tag.name)) {
          return;
        }

        if (allowColumnArithmetic && isColumnArithmetic(node)) {
          return;
        }

        context.report({
          node,
          messageId: "noRawSql"
        });
      }
    };
  }
});
