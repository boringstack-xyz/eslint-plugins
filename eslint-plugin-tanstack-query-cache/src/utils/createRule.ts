import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://github.com/agjs/eslint-plugin-tanstack-query-cache/blob/main/docs/rules/${ruleName}.md`
);
