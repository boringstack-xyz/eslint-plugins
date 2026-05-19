import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/agjs/eslint-plugin-i18n-keys/blob/main/docs/rules/${name}.md`
);
