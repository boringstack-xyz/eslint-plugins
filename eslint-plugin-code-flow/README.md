# eslint-plugin-code-flow

[![CI](https://github.com/agjs/eslint-plugin-code-flow/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-code-flow/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint plugin for control-flow style rules: guard clauses over wrapped happy paths, and related patterns.

## Why

Functions that wrap their entire body in a positive `if` bury the happy path one indentation level deep. Guard clauses invert the condition, return early, and leave the main work at the top level where it reads naturally.

## Install

```sh
pnpm add -D eslint-plugin-code-flow @typescript-eslint/parser
```

## Usage (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import codeFlow from "eslint-plugin-code-flow";

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
      "code-flow": codeFlow
    },
    rules: {
      "code-flow/prefer-early-return": "error"
    }
  }
];
```

Or use the built-in recommended config:

```js
import codeFlow from "eslint-plugin-code-flow";

export default [codeFlow.configs.recommended];
```

## Rules

| Rule | Description |
|------|-------------|
| [`prefer-early-return`](./docs/rules/prefer-early-return.md) | Prefer guard clauses over wrapping the function body in a multi-statement `if` |

## Development

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
```

## Release

Push a `v*` tag; CI publishes to npm when `NPM_TOKEN` is configured.

## License

MIT
