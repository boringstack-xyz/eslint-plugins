# eslint-plugin-env-access

[![CI](https://github.com/agjs/eslint-plugin-env-access/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-env-access/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules that force every environment-variable read through a single
validated singleton:

- **`no-direct-process-env`** — no raw `process.env.X` access outside the
  singleton's own files. Forces every consumer through the typed,
  boot-validated entrypoint.
- **`env-var-must-have-schema-entry`** — every `env.X` access must
  correspond to a key declared in the schema file. Catches typos that
  inference alone can miss when types cross package boundaries.

## Install

```sh
pnpm add -D eslint-plugin-env-access
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import envAccess from "eslint-plugin-env-access";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "env-access": envAccess },
    rules: {
      "env-access/no-direct-process-env": "error",
      "env-access/env-var-must-have-schema-entry": "error"
    }
  }
];
```

Or use the bundled config:

```js
import envAccess from "eslint-plugin-env-access";

export default [envAccess.configs.recommended];
```

## Rules

| Rule | Description | Fixable |
| --- | --- | --- |
| [`no-direct-process-env`](docs/rules/no-direct-process-env.md) | Disallow raw `process.env.X` outside allowed files | – |
| [`env-var-must-have-schema-entry`](docs/rules/env-var-must-have-schema-entry.md) | Every `env.X` must exist in the schema file | – |

## License

MIT.
