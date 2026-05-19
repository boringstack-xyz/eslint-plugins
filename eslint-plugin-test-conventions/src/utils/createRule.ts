import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://github.com/eslint-custom-plugins/eslint-plugin-test-conventions/blob/main/docs/rules/${ruleName}.md`
);
