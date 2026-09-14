# @boring-stack-pkg/eslint-plugin-i18n-keys

## 0.1.3

### Patch Changes

- [#10](https://github.com/boringstack-xyz/eslint-plugins/pull/10) [`c9dfd15`](https://github.com/boringstack-xyz/eslint-plugins/commit/c9dfd15d786ed04486ab6cb6e1c18644adccd4d6) Thanks [@agjs](https://github.com/agjs)! - `static-translation-key-exists` now resolves keys the way i18next does at runtime. A call with a `count` option accepts a dictionary that defines `<key>_other` (or `<key>_ordinal_other` with `ordinal: true`), a string-literal `context` option accepts `<key>_<context>`, and the two combine as `<key>_<context>_other`. Counted calls with no `_other` fallback report the new `missingPluralKey` message naming the expected key, and an uncounted call to a plural-only key still fails. Previously every plural dictionary forced hand-rolled `fooOne`/`fooOther` keys or a lint disable.

  The `eslint` peer range now includes `^10.0.0`; the rule uses no ESLint 9-only API and the BoringStack template already runs it under ESLint 10.

## 0.1.2

### Patch Changes

- [`b45c58b`](https://github.com/boringstack-xyz/eslint-plugins/commit/b45c58b50b9b26dc5dd203719ce2328fcc664b54) Thanks [@agjs](https://github.com/agjs)! - Republish READMEs after monorepo migration — npm still showed stale per-repo CI badges on 0.1.1.

## 0.1.1

### Patch Changes

- [`4ea8d31`](https://github.com/boringstack-xyz/eslint-plugins/commit/4ea8d31533a64de2be713b0efeef67b3bc062917) Thanks [@agjs](https://github.com/agjs)! - Initial publish under the `@boring-stack-pkg` scope. The plugins were previously distributed via GitHub tarball references; this is the first npm release, with built artifacts pre-shipped in `dist/`, no install-time build, and OIDC provenance.
