# eslint-plugin-i18n-keys

[![npm](https://img.shields.io/npm/v/@boring-stack-pkg/eslint-plugin-i18n-keys?logo=npm)](https://www.npmjs.com/package/@boring-stack-pkg/eslint-plugin-i18n-keys) [![source](https://img.shields.io/badge/source-github-blue?logo=github)](https://github.com/boringstack-xyz/eslint-plugins/tree/main/eslint-plugin-i18n-keys)

ESLint rule: **static** `t("…")` / `i18n.t("…")` translation keys must exist in a canonical JSON dictionary (nested keys use dot paths).

## Install

```sh
pnpm add -D @boring-stack-pkg/eslint-plugin-i18n-keys
```

Peer deps: `eslint` 8.57 / 9 / 10, `@typescript-eslint/parser` 8+, `typescript` 5+.

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
        { dictionary: "src/lib/i18n/locales/en/common.json" },
      ],
    },
  },
];
```

The bundled `recommended` config enables the same rule; **override `dictionary`** to match your repo’s locale file path.

## Rules

| Rule                            | Description                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `static-translation-key-exists` | String-literal keys must appear in the JSON dictionary (leaf strings define valid terminal keys). |

### Plural and context suffixes

The rule resolves keys the way i18next does, so the call site can use the
base key while the dictionary stores the suffixed forms:

| Call                                        | Accepted when the dictionary has            |
| ------------------------------------------- | ------------------------------------------- |
| `t("files", { count })`                     | `files_other` (or the plain `files`)        |
| `t("rank", { count, ordinal: true })`       | `rank_ordinal_other`                        |
| `t("friend", { context: "male" })`          | `friend_male` (or the plain `friend`)       |
| `t("guests", { count, context: "vip" })`    | `guests_vip_other`, falling back as i18next |

`_other` is the fallback every language needs, so it is the form the rule
requires; `_one`, `_few`, `_many` and friends are optional extras. A counted
call whose `_other` form is missing reports `missingPluralKey` naming the
expected key. An uncounted call to a plural-only key (`t("files")`) is still
an error, because i18next would render the raw key. Only string-literal
`context` values are resolved; a variable context falls back to the base key.

## Development

```bash
pnpm install
pnpm test
pnpm build
```

## License

MIT.
