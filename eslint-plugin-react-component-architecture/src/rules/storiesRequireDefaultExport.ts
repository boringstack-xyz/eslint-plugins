import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "stories-require-default-export";

type RuleOptions = [];
type MessageIds = "missingDefaultExport";

export const storiesRequireDefaultExportRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description: "Story files must export a Default named export"
    },
    schema: [],
    messages: {
      missingDefaultExport:
        "Story files must contain 'export const Default' or 'export { Default }'"
    }
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();

    if (!filename.endsWith(".stories.tsx")) {
      return {};
    }

    return {
      "Program:exit"(program) {
        let hasDefaultExport = false;

        for (const stmt of program.body) {
          if (stmt.type === AST_NODE_TYPES.ExportNamedDeclaration) {
            // Check for "export const Default"
            if (
              stmt.declaration &&
              stmt.declaration.type === AST_NODE_TYPES.VariableDeclaration
            ) {
              for (const decl of stmt.declaration.declarations) {
                if (
                  decl.id.type === AST_NODE_TYPES.Identifier &&
                  decl.id.name === "Default"
                ) {
                  hasDefaultExport = true;
                  break;
                }
              }
            }

            // Check for "export { Default }"
            for (const spec of stmt.specifiers) {
              if (
                spec.type === AST_NODE_TYPES.ExportSpecifier &&
                spec.exported.type === AST_NODE_TYPES.Identifier &&
                spec.exported.name === "Default"
              ) {
                hasDefaultExport = true;
                break;
              }
            }
          }
        }

        if (!hasDefaultExport) {
          context.report({
            node: program,
            messageId: "missingDefaultExport"
          });
        }
      }
    };
  }
});
