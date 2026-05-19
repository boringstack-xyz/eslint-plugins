import { ESLintUtils } from "@typescript-eslint/utils";

export interface StripeWebhooksRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<StripeWebhooksRuleDocs>(
  (ruleName) =>
    `https://github.com/agjs/eslint-plugin-stripe-webhooks/blob/main/docs/rules/${ruleName}.md`
);
