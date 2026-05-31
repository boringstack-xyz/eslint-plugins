# @boring-stack-pkg/eslint-plugin-code-flow

## 0.2.0

### Minor Changes

- [#7](https://github.com/boringstack-xyz/eslint-plugins/pull/7) [`77598f4`](https://github.com/boringstack-xyz/eslint-plugins/commit/77598f47b27b07925319c9b1f22987e896bc9380) Thanks [@agjs](https://github.com/agjs)! - Add `no-bare-date-now` rule.

  Disallows direct calls to non-deterministic time/random sources (`Date.now()`, `new Date()` with no args, `Date()` with no args, `Math.random()`) outside an allowlisted set of utility paths. Determinism is required for snapshot tests, workflow replays, and time-travel debugging — every consumer should route through a typed util that can be faked in tests.

  Configurable via the `allowedPaths` option (substring match against the source file path). Enabled in the `recommended` config.

## 0.1.2

### Patch Changes

- [`b45c58b`](https://github.com/boringstack-xyz/eslint-plugins/commit/b45c58b50b9b26dc5dd203719ce2328fcc664b54) Thanks [@agjs](https://github.com/agjs)! - Republish READMEs after monorepo migration — npm still showed stale per-repo CI badges on 0.1.1.

## 0.1.1

### Patch Changes

- [`4ea8d31`](https://github.com/boringstack-xyz/eslint-plugins/commit/4ea8d31533a64de2be713b0efeef67b3bc062917) Thanks [@agjs](https://github.com/agjs)! - Initial publish under the `@boring-stack-pkg` scope. The plugins were previously distributed via GitHub tarball references; this is the first npm release, with built artifacts pre-shipped in `dist/`, no install-time build, and OIDC provenance.
