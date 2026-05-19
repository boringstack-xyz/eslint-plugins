import { multiWriteMustBeTransactionalRule } from "./multi-write-must-be-transactional";
import { transactionUsesTxNotDbRule } from "./transaction-uses-tx-not-db";

export const rules = {
  "multi-write-must-be-transactional": multiWriteMustBeTransactionalRule,
  "transaction-uses-tx-not-db": transactionUsesTxNotDbRule
};
