---
"@boring-stack-pkg/eslint-plugin-i18n-keys": patch
---

`static-translation-key-exists` now resolves keys the way i18next does at runtime. A call with a `count` option accepts a dictionary that defines `<key>_other` (or `<key>_ordinal_other` with `ordinal: true`), a string-literal `context` option accepts `<key>_<context>`, and the two combine as `<key>_<context>_other`. Counted calls with no `_other` fallback report the new `missingPluralKey` message naming the expected key, and an uncounted call to a plural-only key still fails. Previously every plural dictionary forced hand-rolled `fooOne`/`fooOther` keys or a lint disable.

The `eslint` peer range now includes `^10.0.0`; the rule uses no ESLint 9-only API and the BoringStack template already runs it under ESLint 10.
