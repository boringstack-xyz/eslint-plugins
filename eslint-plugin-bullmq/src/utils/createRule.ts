import { ESLintUtils } from "@typescript-eslint/utils";

export interface BullmqRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<BullmqRuleDocs>(
  (ruleName) =>
    `https://github.com/agjs/eslint-plugin-bullmq/blob/main/docs/rules/${ruleName}.md`
);
