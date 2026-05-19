# eslint-plugin-tanstack-query-cache

[![CI](https://github.com/agjs/eslint-plugin-tanstack-query-cache/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-tanstack-query-cache/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules that catch TanStack Query cache bugs when list keys are built with spreads (`queryKey: [...LIST_KEY, filter]`) but mutations still call `setQueryData(LIST_KEY, …)` — which only updates one cache entry.

## Rules

| Rule | Description |
|------|-------------|
| [`prefix-query-key-must-use-set-queries-data`](./docs/rules/prefix-query-key-must-use-set-queries-data.md) | Prefer `setQueriesData({ queryKey: prefix }, …)` and matcher-style `cancelQueries` when hooks extend the key after a spread. |

## Usage (flat config)

```js
import tanstackQueryCache from "eslint-plugin-tanstack-query-cache";

export default [
  {
    files: ["**/*.queries.ts"],
    plugins: { "tanstack-query-cache": tanstackQueryCache },
    rules: {
      "tanstack-query-cache/prefix-query-key-must-use-set-queries-data": "error"
    }
  }
];
```

## Development

```bash
pnpm install
pnpm test
pnpm build
```
