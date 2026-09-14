import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { matchesAnyGlob } from "../utils/glob";

export const RULE_NAME = "portable-schema-types";

export interface PortableSchemaTypesOptions {
  /** Files holding API contract schemas (default `**\/*.schemas.ts`). */
  readonly fileGlob?: string;
}

type RuleOptions = [PortableSchemaTypesOptions];
type MessageIds = "coercingInteger" | "tupleSchema" | "mappedLiteralUnion";

const DEFAULT_FILE_GLOB = "**/*.schemas.ts";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    fileGlob: { type: "string", minLength: 1 }
  }
};

function memberName(
  callee: TSESTree.Expression,
  object: string
): string | null {
  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.computed ||
    callee.object.type !== AST_NODE_TYPES.Identifier ||
    callee.object.name !== object ||
    callee.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return null;
  }

  return callee.property.name;
}

function isMapCall(node: TSESTree.CallExpressionArgument | undefined): boolean {
  return (
    node !== undefined &&
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    !node.callee.computed &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "map"
  );
}

export const portableSchemaTypesRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "In API contract schema files, forbid Elysia schema shapes that the OpenAPI document or the generated client cannot carry faithfully: the coercing `t.Integer()`, `t.Tuple()`, and `t.Union()` over a `.map()` of literals.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      coercingInteger:
        "Elysia's `t.Integer()` coerces from strings and publishes as `anyOf [string, integer]`, so the generated client types this field `string | number`. Use `Type.Integer()` from `@sinclair/typebox` for JSON bodies and responses; keep `t.Numeric()` for query and path parameters.",
      tupleSchema:
        "`t.Tuple()` has no OpenAPI 3.0 representation and the generated client widens it to `T[]`, so the same field gets two incompatible types. Use `t.Array()` or a `t.Object()` with named members.",
      mappedLiteralUnion:
        "`t.Union(values.map(...))` loses the literal types at compile time (the inferred static type is `undefined`). Use `t.UnionEnum([...values])`, or spell the `t.Literal()` members out."
    }
  },
  defaultOptions: [{ fileGlob: DEFAULT_FILE_GLOB }],
  create(context, [options]) {
    const fileGlob = options.fileGlob ?? DEFAULT_FILE_GLOB;
    if (!matchesAnyGlob(context.filename, [fileGlob])) {
      return {};
    }

    const schemaBuilders = new Set<string>();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "elysia") {
          return;
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === AST_NODE_TYPES.ImportSpecifier &&
            specifier.imported.type === AST_NODE_TYPES.Identifier &&
            specifier.imported.name === "t"
          ) {
            schemaBuilders.add(specifier.local.name);
          }
        }
      },
      CallExpression(node) {
        for (const builder of schemaBuilders) {
          const name = memberName(node.callee, builder);

          if (name === "Integer") {
            context.report({ node, messageId: "coercingInteger" });
          } else if (name === "Tuple") {
            context.report({ node, messageId: "tupleSchema" });
          } else if (name === "Union" && isMapCall(node.arguments[0])) {
            context.report({ node, messageId: "mappedLiteralUnion" });
          }
        }
      }
    };
  }
});
