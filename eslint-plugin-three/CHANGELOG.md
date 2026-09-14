# @boring-stack-pkg/eslint-plugin-three

## 0.2.0

### Minor Changes

- [#9](https://github.com/boringstack-xyz/eslint-plugins/pull/9) [`f759b39`](https://github.com/boringstack-xyz/eslint-plugins/commit/f759b39580d193a0ebcf3ca26468520f690184cf) Thanks [@agjs](https://github.com/agjs)! - Add `@boring-stack-pkg/eslint-plugin-three`, a port of the tsforge `three` rule pack.

  Eleven rules for Three.js as a render substrate, with a `recommended` flat config that keeps tsforge's severities: `no-direct-children-mutation` (error, fixable), `no-disabled-frustum-culling` (warn), `no-global-three` (warn), `no-mixed-three-entrypoints` (error, fixable), `no-unbounded-device-pixel-ratio` (warn, fixable), `prefer-named-three-imports` (warn, fixable), `prefer-three-load-async` (warn), `require-instance-buffer-update` (error, fixable), `require-projection-update` (error, fixable), `require-three-dispose-contract` (error), `require-three-loader-error-path` (error).
