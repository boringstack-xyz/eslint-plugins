# eslint-plugin-test-conventions

[![CI](https://github.com/agjs/eslint-plugin-test-conventions/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-test-conventions/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules that catch the most common test-suite mistakes:

- **`no-focused-tests`** — `test.only` / `it.only` / `fdescribe` / `fit`
  left in committed code. The single `.only` that turns CI green by
  skipping everything else.
- **`no-direct-db-in-tests`** — tests reaching into the DB driver
  directly, bypassing the helpers entrypoint where you do connection
  probing, isolation, and cleanup.
- **`test-file-mirrors-source`** — orphaned `*.test.ts` files left
  behind after a refactor, still passing, still giving you false
  confidence in code that no longer exists.

## Install

```sh
pnpm add -D eslint-plugin-test-conventions
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import testConventions from "eslint-plugin-test-conventions";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "test-conventions": testConventions },
    rules: {
      "test-conventions/no-focused-tests": "error",
      "test-conventions/no-direct-db-in-tests": "error",
      "test-conventions/test-file-mirrors-source": "error"
    }
  }
];
```

Or use the bundled config:

```js
import testConventions from "eslint-plugin-test-conventions";

export default [testConventions.configs.recommended];
```

## Rules

| Rule | Description | Fixable |
| --- | --- | --- |
| [`no-focused-tests`](docs/rules/no-focused-tests.md) | Disallow `.only` and bare aliases (`fdescribe`, `fit`) | – |
| [`no-direct-db-in-tests`](docs/rules/no-direct-db-in-tests.md) | Tests must go through the helpers entrypoint | – |
| [`test-file-mirrors-source`](docs/rules/test-file-mirrors-source.md) | Every test file must mirror an existing source file | – |

## License

MIT.
