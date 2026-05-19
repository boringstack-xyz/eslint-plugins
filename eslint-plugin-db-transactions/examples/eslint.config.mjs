import tsParser from "@typescript-eslint/parser";
import dbTransactions from "eslint-plugin-db-transactions";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "db-transactions": dbTransactions
    },
    rules: {
      "db-transactions/multi-write-must-be-transactional": "error",
      "db-transactions/transaction-uses-tx-not-db": "error"
    }
  }
];
