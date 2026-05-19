import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://github.com/eslint-custom-plugins/eslint-plugin-cache-keys/blob/main/docs/rules/${ruleName}.md`
);
