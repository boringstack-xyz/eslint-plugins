import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "react-import-named";

export interface ReactImportNamedOptions {
  readonly forbidDefaultImport?: boolean;
}

type RuleOptions = [ReactImportNamedOptions];
type MessageIds = "noDefaultImport";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    forbidDefaultImport: {
      type: "boolean"
    }
  }
};

export const reactImportNamedRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Use named imports from React instead of default import"
    },
    schema: [optionSchema],
    messages: {
      noDefaultImport:
        "Use named imports from React: import { ... } from 'react'"
    }
  },
  defaultOptions: [{ forbidDefaultImport: true }],
  create(context, [options]) {
    const forbidDefaultImport = options.forbidDefaultImport ?? true;

    if (!forbidDefaultImport) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react") {
          return;
        }

        let hasDefaultImport = false;
        let hasNamedImports = false;

        for (const spec of node.specifiers) {
          if (spec.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
            hasDefaultImport = true;
          } else if (spec.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
            // import * as React is OK
            return;
          } else if (spec.type === AST_NODE_TYPES.ImportSpecifier) {
            hasNamedImports = true;
          }
        }

        // Flag if only default import
        if (hasDefaultImport && !hasNamedImports) {
          context.report({
            node,
            messageId: "noDefaultImport"
          });
        }
      }
    };
  }
});
