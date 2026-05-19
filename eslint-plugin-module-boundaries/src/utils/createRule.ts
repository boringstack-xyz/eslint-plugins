import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://github.com/module-boundaries/eslint-plugin-module-boundaries/blob/main/docs/rules/${ruleName}.md`
);
