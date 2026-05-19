import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "classnames-import-name";

export interface ClassnamesImportNameOptions {
  readonly requiredName?: string;
}

type RuleOptions = [ClassnamesImportNameOptions];
type MessageIds = "wrongImportName";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    requiredName: {
      type: "string"
    }
  }
};

export const classnamesImportNameRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce classNames as the import name for classnames module"
    },
    schema: [optionSchema],
    messages: {
      wrongImportName:
        "Import classnames with the name 'classNames' (not '{{imported}}')"
    }
  },
  defaultOptions: [{ requiredName: "classNames" }],
  create(context, [options]) {
    const requiredName = options.requiredName ?? "classNames";

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "classnames") {
          return;
        }

        for (const spec of node.specifiers) {
          // Check default imports
          if (spec.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
            if (spec.local.name !== requiredName) {
              context.report({
                node: spec,
                messageId: "wrongImportName",
                data: { imported: spec.local.name }
              });
            }
          }
        }
      }
    };
  }
});
