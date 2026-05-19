# eslint-plugin-cache-keys

[![CI](https://github.com/agjs/eslint-plugin-cache-keys/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-cache-keys/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules preventing the most common cache-layer bugs:

- **`cache-set-must-have-ttl`** — cache writes without a TTL field
  accumulate forever and OOM Redis.
- **`cache-key-must-be-prefixed`** — cache keys must start with a
  configured namespace prefix to prevent collisions when multiple apps
  share a Redis instance.
- **`cache-key-from-helper`** *(opt-in)* — cache keys must come from a
  configured helper function. Forces a single source of truth and makes
  invalidation tractable across a codebase.

The recommended config enables rules 1 and 2 at `error`. Rule 3 is opt-in
because it requires you to declare your project's key-builder helpers.

## Install

```sh
pnpm add -D eslint-plugin-cache-keys
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import cacheKeys from "eslint-plugin-cache-keys";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "cache-keys": cacheKeys },
    rules: {
      "cache-keys/cache-set-must-have-ttl": "error",
      "cache-keys/cache-key-must-be-prefixed": "error",
      "cache-keys/cache-key-from-helper": [
        "error",
        { helperNames: ["userCacheKey", "stripeEventCacheKey"] }
      ]
    }
  }
];
```

Or use the bundled config (rules 1–2 enabled, rule 3 off):

```js
import cacheKeys from "eslint-plugin-cache-keys";

export default [cacheKeys.configs.recommended];
```

## Rules

| Rule | Description | Default in recommended |
| --- | --- | --- |
| [`cache-set-must-have-ttl`](docs/rules/cache-set-must-have-ttl.md) | `.set` calls must include `ttlSeconds` | `error` |
| [`cache-key-must-be-prefixed`](docs/rules/cache-key-must-be-prefixed.md) | Keys must start with a configured prefix | `error` |
| [`cache-key-from-helper`](docs/rules/cache-key-from-helper.md) | Keys must be built by configured helpers | `off` (opt-in) |

## License

MIT.
