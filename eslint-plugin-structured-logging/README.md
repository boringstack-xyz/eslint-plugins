# eslint-plugin-structured-logging

[![CI](https://github.com/agjs/eslint-plugin-structured-logging/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-structured-logging/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules that enforce structured-logging discipline:

- **`require-event-field`** — every logger call carries a stable `event:`
  identifier so log search isn't substring-matching.
- **`mask-pii-fields`** — emails, tokens, passwords, etc. must be masked
  before they hit the logger.
- **`no-error-stringify`** — never `String(error)` / `${error}` /
  `error.toString()`; use a configured extractor (default `getErrorMessage`)
  that preserves the cause chain.

All three rules treat any call to a name in `loggerNames` (default
`logger`, `log`, `reqLogger`, `requestLogger`) on a method in `loggerMethods`
(default `fatal`/`error`/`warn`/`info`/`debug`/`trace`) as a logger call.

## Install

```sh
pnpm add -D eslint-plugin-structured-logging
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import structuredLogging from "eslint-plugin-structured-logging";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "structured-logging": structuredLogging },
    rules: {
      "structured-logging/require-event-field": "error",
      "structured-logging/mask-pii-fields": "error",
      "structured-logging/no-error-stringify": "error"
    }
  }
];
```

Or use the bundled config:

```js
import structuredLogging from "eslint-plugin-structured-logging";

export default [structuredLogging.configs.recommended];
```

## Rules

| Rule | Description | Fixable |
| --- | --- | --- |
| [`require-event-field`](docs/rules/require-event-field.md) | Require `event:` in logger payloads | – |
| [`mask-pii-fields`](docs/rules/mask-pii-fields.md) | Disallow unmasked PII | – |
| [`no-error-stringify`](docs/rules/no-error-stringify.md) | Disallow `String(error)` / `${error}` / `error.toString()` | yes (when extractor is imported) |

## License

MIT.
