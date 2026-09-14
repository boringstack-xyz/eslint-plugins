# @boring-stack-pkg/eslint-plugin-module-boundaries

## 0.2.0

### Minor Changes

- [`ee618ed`](https://github.com/boringstack-xyz/eslint-plugins/commit/ee618ede223d3d5d16f22206fc85cfeed7adb411) Thanks [@agjs](https://github.com/agjs)! - `single-semantic-module` gains `ignorePrivateDeclarations` (default `false`). When enabled, only exported declarations are classified: a non-exported config object, render helper or private class next to the hook or component that uses it no longer gives the module a second semantic category. Two exported categories still conflict.

## 0.1.2

### Patch Changes

- [`b45c58b`](https://github.com/boringstack-xyz/eslint-plugins/commit/b45c58b50b9b26dc5dd203719ce2328fcc664b54) Thanks [@agjs](https://github.com/agjs)! - Republish READMEs after monorepo migration — npm still showed stale per-repo CI badges on 0.1.1.

## 0.1.1

### Patch Changes

- [`4ea8d31`](https://github.com/boringstack-xyz/eslint-plugins/commit/4ea8d31533a64de2be713b0efeef67b3bc062917) Thanks [@agjs](https://github.com/agjs)! - Initial publish under the `@boring-stack-pkg` scope. The plugins were previously distributed via GitHub tarball references; this is the first npm release, with built artifacts pre-shipped in `dist/`, no install-time build, and OIDC provenance.
