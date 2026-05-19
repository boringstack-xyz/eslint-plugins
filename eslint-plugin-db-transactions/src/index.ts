import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { multiWriteMustBeTransactionalRule } from "./rules/multi-write-must-be-transactional";
import { transactionUsesTxNotDbRule } from "./rules/transaction-uses-tx-not-db";

type DbTransactionsPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: DbTransactionsPlugin = {
  meta: {
    name: "eslint-plugin-db-transactions",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "db-transactions": plugin
  },
  rules: recommendedRules
};

export {
  multiWriteMustBeTransactionalRule,
  transactionUsesTxNotDbRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
