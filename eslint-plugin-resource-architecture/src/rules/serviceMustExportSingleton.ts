import path from "node:path";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { posixRelativeFromCwd } from "../utils/path";

export const RULE_NAME = "service-must-export-singleton";

type MessageIds = "missingSingleton" | "missingClass";

export interface ServiceMustExportSingletonOptions {
  readonly singletonNamePattern?: string;
  /**
   * When true, a `*.service.ts` file is required to export a class.
   * When false (default), files that export only free functions are
   * accepted as a valid alternative service style — the rule only fires
   * when a class IS exported but the matching singleton is missing.
   */
  readonly requireClass?: boolean;
}

type Options = [ServiceMustExportSingletonOptions?];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    singletonNamePattern: { type: "string" },
    requireClass: { type: "boolean" }
  }
};

const DEFAULT_SINGLETON_NAME_PATTERN = "^[a-z][a-zA-Z0-9]*Service$";

function isServiceFile(relativeFilename: string): boolean {
  return relativeFilename.endsWith(".service.ts");
}

function getExportedClassNames(program: TSESTree.Program): string[] {
  const classNames: string[] = [];

  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      const declaration = statement.declaration;
      if (
        declaration?.type === AST_NODE_TYPES.ClassDeclaration &&
        declaration.id?.type === AST_NODE_TYPES.Identifier
      ) {
        classNames.push(declaration.id.name);
      }
    }

    if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      const declaration = statement.declaration;
      if (
        declaration.type === AST_NODE_TYPES.ClassDeclaration &&
        declaration.id?.type === AST_NODE_TYPES.Identifier
      ) {
        classNames.push(declaration.id.name);
      }
    }
  }

  return classNames;
}

function hasExportedSingleton(
  program: TSESTree.Program,
  exportedClassNames: readonly string[],
  singletonNameRegex: RegExp
): boolean {
  const exportedSet = new Set(exportedClassNames);

  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) {
      continue;
    }

    const declaration = statement.declaration;
    if (!declaration || declaration.type !== AST_NODE_TYPES.VariableDeclaration) {
      continue;
    }

    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== AST_NODE_TYPES.Identifier) {
        continue;
      }

      if (!singletonNameRegex.test(declarator.id.name)) {
        continue;
      }

      const init = declarator.init;
      if (!init || init.type !== AST_NODE_TYPES.NewExpression) {
        continue;
      }

      const callee = init.callee;
      if (callee.type !== AST_NODE_TYPES.Identifier) {
        continue;
      }

      if (!exportedSet.has(callee.name)) {
        continue;
      }

      return true;
    }
  }

  return false;
}

export const serviceMustExportSingletonRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `*.service.ts` files that export a class to also export a singleton instance of that class. When `requireClass: true`, additionally require that a class is exported."
    },
    schema: [optionSchema],
    messages: {
      missingSingleton:
        "Class '{{class}}' is exported but no matching singleton — add `export const {{singleton}} = new {{class}}()`.",
      missingClass:
        "Service files must export a class (requireClass=true). Either export one and pair it with a singleton, or set `requireClass: false`."
    }
  },
  defaultOptions: [{}],
  create(context, [rawOptions]) {
    const singletonNamePattern =
      rawOptions?.singletonNamePattern ?? DEFAULT_SINGLETON_NAME_PATTERN;
    const singletonNameRegex = new RegExp(singletonNamePattern);
    const requireClass = rawOptions?.requireClass ?? false;

    const filename = context.getFilename();
    if (!filename || filename === "<input>") {
      return {};
    }

    const relative = posixRelativeFromCwd(filename);
    if (relative.startsWith("..")) {
      return {};
    }

    if (!isServiceFile(path.posix.basename(relative))) {
      return {};
    }

    return {
      Program(program) {
        const exportedClassNames = getExportedClassNames(program);

        if (exportedClassNames.length === 0) {
          if (requireClass) {
            context.report({ node: program, messageId: "missingClass" });
          }
          return;
        }

        if (!hasExportedSingleton(program, exportedClassNames, singletonNameRegex)) {
          const className = exportedClassNames[0] ?? "Service";
          const singleton =
            className.charAt(0).toLowerCase() + className.slice(1);
          context.report({
            node: program,
            messageId: "missingSingleton",
            data: { class: className, singleton }
          });
        }
      }
    };
  }
});
