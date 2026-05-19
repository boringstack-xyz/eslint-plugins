import { ESLintUtils } from "@typescript-eslint/utils";

export interface DrizzleRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<DrizzleRuleDocs>(
  (ruleName) =>
    `https://github.com/agjs/eslint-plugin-drizzle-conventions/blob/main/docs/rules/${ruleName}.md`
);
