import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import type { NormalizedOptions, SchemaLibrary } from "../utils/config";
import { unwrapExpression } from "../utils/ast";

const SCHEMA_LIBRARY_MODULES: Record<SchemaLibrary, readonly string[]> = {
  zod: ["zod"],
  yup: ["yup"],
  valibot: ["valibot"]
};

// We intentionally start empty and only enable schema detection when the file
// imports a known schema library. This avoids false positives for local
// variables named `z`, `yup`, etc.
const DEFAULT_NAMESPACE_IDENTIFIERS = new Set<string>();

const SCHEMA_BUILDER_NAMES = new Set([
  "array",
  "boolean",
  "date",
  "enum",
  "literal",
  "number",
  "object",
  "record",
  "string",
  "tuple",
  "union"
]);

export interface SchemaImportContext {
  readonly namespaceIdentifiers: ReadonlySet<string>;
  readonly builderIdentifiers: ReadonlySet<string>;
}

export function collectSchemaImportContext(
  program: TSESTree.Program,
  options: NormalizedOptions
): SchemaImportContext {
  const namespaceIdentifiers = new Set(DEFAULT_NAMESPACE_IDENTIFIERS);
  const builderIdentifiers = new Set<string>();
  const enabledModules = new Set(
    options.schemaLibraries.flatMap((library) => SCHEMA_LIBRARY_MODULES[library])
  );

  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }

    if (statement.importKind === "type") {
      continue;
    }

    const source = String(statement.source.value);

    if (!enabledModules.has(source)) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
        namespaceIdentifiers.add(specifier.local.name);
        continue;
      }

      if (specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
        namespaceIdentifiers.add(specifier.local.name);
        continue;
      }

      if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
        if (specifier.importKind === "type") {
          continue;
        }

        const importedName =
          specifier.imported.type === AST_NODE_TYPES.Identifier
            ? specifier.imported.name
            : "value" in specifier.imported
              ? String(specifier.imported.value)
              : null;

        if (!importedName) {
          continue;
        }

        if (importedName === "z") {
          namespaceIdentifiers.add(specifier.local.name);
        }

        if (SCHEMA_BUILDER_NAMES.has(importedName)) {
          builderIdentifiers.add(specifier.local.name);
        }
      }
    }
  }

  return {
    namespaceIdentifiers,
    builderIdentifiers
  };
}

export function isSchemaExpression(
  expression: TSESTree.Expression,
  context: SchemaImportContext
): boolean {
  const unwrapped = unwrapExpression(expression);

  if (unwrapped.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const rootName = getExpressionRootIdentifier(unwrapped.callee);

  if (!rootName) {
    return false;
  }

  return (
    context.namespaceIdentifiers.has(rootName) ||
    context.builderIdentifiers.has(rootName)
  );
}

function getExpressionRootIdentifier(
  node:
    | TSESTree.Expression
    | TSESTree.PrivateIdentifier
    | TSESTree.Super
): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }

  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return getExpressionRootIdentifier(node.object);
  }

  if (node.type === AST_NODE_TYPES.CallExpression) {
    return getExpressionRootIdentifier(node.callee);
  }

  if (node.type === AST_NODE_TYPES.ChainExpression) {
    return getExpressionRootIdentifier(node.expression);
  }

  return null;
}
