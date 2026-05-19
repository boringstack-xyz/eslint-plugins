import { ESLintUtils } from "@typescript-eslint/utils";

export interface CodeFlowRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<CodeFlowRuleDocs>(
  (ruleName) =>
    `https://github.com/agjs/eslint-plugin-code-flow/blob/main/docs/rules/${ruleName}.md`
);
