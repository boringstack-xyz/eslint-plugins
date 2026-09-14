# @boring-stack-pkg/eslint-plugin-audit-log

## 0.2.0

### Minor Changes

- [#15](https://github.com/boringstack-xyz/eslint-plugins/pull/15) [`3c02b5c`](https://github.com/boringstack-xyz/eslint-plugins/commit/3c02b5c823bc6cdcc93f0ab15a33f1c917d8c7ac) Thanks [@agjs](https://github.com/agjs)! - `mutating-service-must-audit` now checks a service's public surface only: module-private functions (not exported) and `private` / `protected` / `#name` class methods are treated as part of the audited method's body, so an `insertDetail` helper called inside an audited `createComponent` transaction no longer needs a second `audit.record`. Exported functions, public methods and properties of service objects are still checked. Set the new `includePrivate: true` option to restore the previous behaviour.

## 0.1.2

### Patch Changes

- [`b45c58b`](https://github.com/boringstack-xyz/eslint-plugins/commit/b45c58b50b9b26dc5dd203719ce2328fcc664b54) Thanks [@agjs](https://github.com/agjs)! - Republish READMEs after monorepo migration — npm still showed stale per-repo CI badges on 0.1.1.

## 0.1.1

### Patch Changes

- [`4ea8d31`](https://github.com/boringstack-xyz/eslint-plugins/commit/4ea8d31533a64de2be713b0efeef67b3bc062917) Thanks [@agjs](https://github.com/agjs)! - Initial publish under the `@boring-stack-pkg` scope. The plugins were previously distributed via GitHub tarball references; this is the first npm release, with built artifacts pre-shipped in `dist/`, no install-time build, and OIDC provenance.
