# eslint-plugin-db-transactions

[![CI](https://github.com/agjs/eslint-plugin-db-transactions/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-db-transactions/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules enforcing transactional correctness in Drizzle (or any ORM
with `db.transaction(async (tx) => ...)` APIs):

- **`multi-write-must-be-transactional`** — two or more DB writes in the
  same function must run inside a single transaction. Catches the
  partial-failure split-brain that comes from ad-hoc multi-write
  service methods.
- **`transaction-uses-tx-not-db`** — inside a transaction callback,
  write calls must use the `tx` handle, not the outer `db`. Catches
  the classic transaction-leak bug where a write runs on the outer
  connection and silently bypasses rollback.

## Install

```sh
pnpm add -D eslint-plugin-db-transactions
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import dbTransactions from "eslint-plugin-db-transactions";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "db-transactions": dbTransactions },
    rules: {
      "db-transactions/multi-write-must-be-transactional": "error",
      "db-transactions/transaction-uses-tx-not-db": "error"
    }
  }
];
```

Or use the bundled config:

```js
import dbTransactions from "eslint-plugin-db-transactions";

export default [dbTransactions.configs.recommended];
```

## Notes

The "split across two adjacent transactions" warning in
`multi-write-must-be-transactional` reflects the most common refactor
bug — when splitting a service method, you separate writes that must
roll back together. If your project genuinely uses multiple small
transactions per function, raise `thresholdWrites` or remove the
relevant methods from `writeMethods`.

## Rules

| Rule | Description | Fixable |
| --- | --- | --- |
| [`multi-write-must-be-transactional`](docs/rules/multi-write-must-be-transactional.md) | Multi-step writes in one function must run inside a single transaction | – |
| [`transaction-uses-tx-not-db`](docs/rules/transaction-uses-tx-not-db.md) | Inside a transaction, write calls must use `tx`, not the outer `db` | – |

## License

MIT.
