# eslint-plugin-i18n-keys

[![CI](https://github.com/agjs/eslint-plugin-i18n-keys/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-i18n-keys/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rule: **static** `t("…")` / `i18n.t("…")` translation keys must exist in a canonical JSON dictionary (nested keys use dot paths).

## Install

```sh
pnpm add -D eslint-plugin-i18n-keys
```

Peer deps: `eslint` 8.57 / 9+, `@typescript-eslint/parser` 8+, `typescript` 5+.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import i18nKeys from "eslint-plugin-i18n-keys";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "i18n-keys": i18nKeys },
    rules: {
      "i18n-keys/static-translation-key-exists": [
        "error",
        { dictionary: "src/lib/i18n/locales/en/common.json" }
      ]
    }
  }
];
```

The bundled `recommended` config enables the same rule; **override `dictionary`** to match your repo’s locale file path.

## Rules

| Rule | Description |
| --- | --- |
| `static-translation-key-exists` | String-literal keys must appear in the JSON dictionary (leaf strings define valid terminal keys). |

## Development

```bash
pnpm install
pnpm test
pnpm build
```

## License

MIT.
