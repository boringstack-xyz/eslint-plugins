# @boring-stack-pkg/eslint-plugin-resource-architecture

## 0.2.0

### Minor Changes

- [#5](https://github.com/boringstack-xyz/eslint-plugins/pull/5) [`7954d7b`](https://github.com/boringstack-xyz/eslint-plugins/commit/7954d7b6d6d8b476f1595240625b31f2b50fd405) Thanks [@agjs](https://github.com/agjs)! - Support ESLint 10.

  ESLint 10 removed `context.getFilename()` (deprecated since v9). Switched
  all rules in these three plugins to use the `context.filename` property
  introduced in ESLint 9.

  Peer dependency widened to `^8.57.0 || ^9.0.0 || ^10.0.0`. ESLint 8.x
  and 9.x consumers see no behavior change.

## 0.1.2

### Patch Changes

- [`b45c58b`](https://github.com/boringstack-xyz/eslint-plugins/commit/b45c58b50b9b26dc5dd203719ce2328fcc664b54) Thanks [@agjs](https://github.com/agjs)! - Republish READMEs after monorepo migration — npm still showed stale per-repo CI badges on 0.1.1.

## 0.1.1

### Patch Changes

- [`4ea8d31`](https://github.com/boringstack-xyz/eslint-plugins/commit/4ea8d31533a64de2be713b0efeef67b3bc062917) Thanks [@agjs](https://github.com/agjs)! - Initial publish under the `@boring-stack-pkg` scope. The plugins were previously distributed via GitHub tarball references; this is the first npm release, with built artifacts pre-shipped in `dist/`, no install-time build, and OIDC provenance.
