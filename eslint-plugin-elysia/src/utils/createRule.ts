import { ESLintUtils } from "@typescript-eslint/utils";

export interface ElysiaRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<ElysiaRuleDocs>(
  (ruleName) =>
    `https://github.com/agjs/eslint-plugin-elysia/blob/main/docs/rules/${ruleName}.md`
);
