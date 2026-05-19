import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "no-dark-mode-classes";

type RuleOptions = [];
type MessageIds = "noDarkMode";

const DARK_MODE_REGEX = /(^|\s)dark:/;

export const noDarkModeClassesRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow dark: mode Tailwind classes - light mode only"
    },
    schema: [],
    messages: {
      noDarkMode: "Remove dark: prefix - this library only supports light mode"
    }
  },
  defaultOptions: [],
  create(context) {
    const checkString = (str: string, node: TSESTree.Node) => {
      if (DARK_MODE_REGEX.test(str)) {
        context.report({
          node,
          messageId: "noDarkMode"
        });
      }
    };

    return {
      "Literal[value=/dark:/]"(node: TSESTree.Literal) {
        if (typeof node.value === "string") {
          checkString(node.value, node);
        }
      },
      "TemplateLiteral"(node: TSESTree.TemplateLiteral) {
        for (const quasi of node.quasis) {
          checkString(quasi.value.raw, node);
        }
      }
    };
  }
});
