# @boring-stack-pkg/eslint-plugin-drizzle-conventions

## 0.3.0

### Minor Changes

- [#17](https://github.com/boringstack-xyz/eslint-plugins/pull/17) [`12fd7ee`](https://github.com/boringstack-xyz/eslint-plugins/commit/12fd7ee32754f76a24ed1397ab6bed18940c85a9) Thanks [@agjs](https://github.com/agjs)! - `no-raw-sql-outside-allowlist` allows `sql` templates whose literal text is only arithmetic around interpolated column references, such as `sql\`${links.viewCount} + 1\``, the idiomatic atomic increment. Templates with no holes, string literals in the holes, or any other SQL text are still reported. Disable with the new `allowColumnArithmetic: false` option.

## 0.2.0

### Minor Changes

- [#15](https://github.com/boringstack-xyz/eslint-plugins/pull/15) [`3c02b5c`](https://github.com/boringstack-xyz/eslint-plugins/commit/3c02b5c823bc6cdcc93f0ab15a33f1c917d8c7ac) Thanks [@agjs](https://github.com/agjs)! - `no-raw-sql-outside-allowlist` allows `sql` templates whose literal text is only arithmetic around interpolated column references, such as `sql\`${links.viewCount} + 1\``, the idiomatic atomic increment. Templates with no holes, string literals in the holes, or any other SQL text are still reported. Disable with the new `allowColumnArithmetic: false` option.

## 0.1.2

### Patch Changes

- [`b45c58b`](https://github.com/boringstack-xyz/eslint-plugins/commit/b45c58b50b9b26dc5dd203719ce2328fcc664b54) Thanks [@agjs](https://github.com/agjs)! - Republish READMEs after monorepo migration — npm still showed stale per-repo CI badges on 0.1.1.

## 0.1.1

### Patch Changes

- [`4ea8d31`](https://github.com/boringstack-xyz/eslint-plugins/commit/4ea8d31533a64de2be713b0efeef67b3bc062917) Thanks [@agjs](https://github.com/agjs)! - Initial publish under the `@boring-stack-pkg` scope. The plugins were previously distributed via GitHub tarball references; this is the first npm release, with built artifacts pre-shipped in `dist/`, no install-time build, and OIDC provenance.
