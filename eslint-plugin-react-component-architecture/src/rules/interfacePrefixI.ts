import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "interface-prefix-i";

export interface InterfacePrefixIOptions {
  readonly allowList?: readonly string[];
}

type RuleOptions = [InterfacePrefixIOptions];
type MessageIds = "mustPrefixI";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowList: {
      type: "array",
      items: { type: "string" }
    }
  }
};

export const interfacePrefixIRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description: "Interfaces should be prefixed with 'I'"
    },
    schema: [optionSchema],
    messages: {
      mustPrefixI: "Interface should be prefixed with 'I' (e.g., I{{name}})"
    }
  },
  defaultOptions: [{ allowList: [] }],
  create(context, [options]) {
    const allowList = new Set(options.allowList ?? []);

    return {
      TSInterfaceDeclaration(node) {
        const name = node.id.name;

        // Already starts with I
        if (name.startsWith("I")) {
          return;
        }

        // In allowList
        if (allowList.has(name)) {
          return;
        }

        // If it extends third-party types, allow it
        if (node.extends && node.extends.length > 0) {
          // Simple heuristic: if extends from identifier starting with capital letter
          // and it's not in current scope, it's likely third-party
          const hasThirdPartyExtend = node.extends.some((ext) => {
            if (
              ext.expression.type === AST_NODE_TYPES.Identifier &&
              /^[A-Z]/.test(ext.expression.name)
            ) {
              return true;
            }
            return false;
          });
          if (hasThirdPartyExtend) {
            return;
          }
        }

        context.report({
          node: node.id,
          messageId: "mustPrefixI",
          data: { name }
        });
      }
    };
  }
});
