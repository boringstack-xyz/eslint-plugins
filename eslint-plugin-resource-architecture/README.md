# eslint-plugin-resource-architecture

[![CI](https://github.com/agjs/eslint-plugin-resource-architecture/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-resource-architecture/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules for **resource-oriented** APIs: concern-suffixed files under `src/api/<resource>/`, import boundaries between concerns, and a few filesystem-backed conventions (noop providers).

## Why

The same layout rules are usually copy-pasted into `no-restricted-imports`, filename conventions, and one-off scripts. This plugin encodes the **resource + concern** pattern once so new files either match the architecture or fail lint — without relying on humans to remember which suffix may import what.

## Install

```sh
pnpm add -D eslint-plugin-resource-architecture @typescript-eslint/parser
```

## Flat config

**Shortcut** (recommended preset only; add your own `files` / `languageOptions` as needed):

```js
import tsParser from "@typescript-eslint/parser";
import resourceArchitecture from "eslint-plugin-resource-architecture";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    ...resourceArchitecture.configs.recommended
  }
];
```

**Explicit** (same as [eslint-plugin-elysia](https://github.com/agjs/eslint-plugin-elysia) / [eslint-plugin-drizzle-conventions](https://github.com/agjs/eslint-plugin-drizzle-conventions)):

```js
import tsParser from "@typescript-eslint/parser";
import resourceArchitecture from "eslint-plugin-resource-architecture";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: { "resource-architecture": resourceArchitecture },
    rules: resourceArchitecture.configs.recommended.rules
  }
];
```

The recommended preset enables all five rules at `"error"`. Override individual rules as needed.

## Rules

| Rule | Description |
| --- | --- |
| [files-must-be-resource-prefixed](https://github.com/agjs/eslint-plugin-resource-architecture/blob/main/docs/rules/files-must-be-resource-prefixed.md) | Under `src/api/<resource>/`, concern files must be named `<resource>.<concern>.ts`. |
| [service-must-export-singleton](https://github.com/agjs/eslint-plugin-resource-architecture/blob/main/docs/rules/service-must-export-singleton.md) | `*.service.ts` must export a class and a singleton instance. |
| [pluggable-providers-must-have-noop](https://github.com/agjs/eslint-plugin-resource-architecture/blob/main/docs/rules/pluggable-providers-must-have-noop.md) | `src/lib/.../providers/` must include a `noop.ts` sibling. |
| [concern-import-boundaries](https://github.com/agjs/eslint-plugin-resource-architecture/blob/main/docs/rules/concern-import-boundaries.md) | Concern-specific import restrictions (`*.schemas.ts`, `*.types.ts`, etc.). |
| [no-cross-resource-internal-imports](https://github.com/agjs/eslint-plugin-resource-architecture/blob/main/docs/rules/no-cross-resource-internal-imports.md) | Cross-resource imports must target public surface files only. |

## Design notes

- **Paths**: Rules use project-relative paths where possible so [RuleTester](https://typescript-eslint.io/packages/rule-tester/) filenames behave like real repo paths.
- **Filesystem**: `pluggable-providers-must-have-noop` reads the directory on disk; tests inject an FS adapter. In CI, the real filesystem applies.
- **Import resolution**: `no-cross-resource-internal-imports` resolves extensionless relative imports to `*.ts` deterministically (no dependency on OS module resolution in the linter).

## Development

```sh
pnpm install
pnpm test
pnpm run typecheck
pnpm run build
```

## Release

Tag a `v*` version and push the tag — [`.github/workflows/release.yml`](.github/workflows/release.yml) publishes with `NPM_TOKEN` (same pattern as [eslint-plugin-module-boundaries](https://github.com/agjs/eslint-plugin-module-boundaries)).

## License

MIT.
