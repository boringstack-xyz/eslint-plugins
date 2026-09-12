# eslint-plugin-three

[![npm](https://img.shields.io/npm/v/@boring-stack-pkg/eslint-plugin-three?logo=npm)](https://www.npmjs.com/package/@boring-stack-pkg/eslint-plugin-three) [![source](https://img.shields.io/badge/source-github-blue?logo=github)](https://github.com/boringstack-xyz/eslint-plugins/tree/main/eslint-plugin-three)

ESLint plugin for projects that use [Three.js](https://threejs.org/) as a render substrate: canonical imports, GPU dispose contracts, scene-graph APIs, loader error paths, and instanced-buffer updates.

This package is a port of the [tsforge](https://github.com/tsforge/tsforge) `three` rule pack. Rule names, messages, options, autofixes and default severities are kept identical to the originals; only the packaging (standalone ESLint plugin with a `recommended` flat config) differs.

## Why

Three.js is unopinionated about how you get objects on screen, and most of its footguns are silent: a `frustumCulled = false` costs a draw call forever, `camera.aspect = ...` without `updateProjectionMatrix()` leaves the frustum stale, `setMatrixAt()` without `instanceMatrix.needsUpdate = true` never uploads, a class that owns a `WebGLRenderer` and never disposes it leaks VRAM, and `three/examples/jsm/...` next to `three/addons/...` can bundle two copies of the library. These rules catch those patterns at lint time.

All rules key off the module graph — a `Vector3` imported from `./math` is never treated as a Three.js `Vector3`.

## Install

```sh
pnpm add -D @boring-stack-pkg/eslint-plugin-three @typescript-eslint/parser
```

## Usage (flat config)

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import three from "@boring-stack-pkg/eslint-plugin-three";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { three },
    rules: three.configs.recommended.rules,
  },
];
```

Or spread the whole preset (it registers the plugin under the `three` namespace):

```js
import three from "@boring-stack-pkg/eslint-plugin-three";

export default [three.configs.recommended];
```

## Rules

Severities are those of the `recommended` config (mirroring tsforge's `rulesConfig`). Rules marked with a wrench are autofixable.

| Rule                                                                                 | Recommended | Fix | Description                                                                                                                  |
| ------------------------------------------------------------------------------------ | ----------- | --- | ---------------------------------------------------------------------------------------------------------------------------- |
| [`no-direct-children-mutation`](docs/rules/no-direct-children-mutation.md)           | `error`     | 🔧  | Do not mutate `Object3D.children` as an array; use `add()` / `remove()` so hierarchy bookkeeping stays consistent.           |
| [`no-disabled-frustum-culling`](docs/rules/no-disabled-frustum-culling.md)           | `warn`      |     | Leave `Object3D.frustumCulled` at its default unless a custom shader invalidates geometric bounds.                           |
| [`no-global-three`](docs/rules/no-global-three.md)                                   | `warn`      |     | Do not rely on a global `THREE` identifier or `require("three")`; import from the `three` package.                           |
| [`no-mixed-three-entrypoints`](docs/rules/no-mixed-three-entrypoints.md)             | `error`     | 🔧  | Import only from `three` and `three/addons/...`; `three/examples/jsm/`, `three/src/`, `three/build/` and CDN URLs are banned. |
| [`no-unbounded-device-pixel-ratio`](docs/rules/no-unbounded-device-pixel-ratio.md)   | `warn`      | 🔧  | Cap `window.devicePixelRatio` before passing it to `setPixelRatio` (`maxPixelRatio`, default `2`).                           |
| [`prefer-named-three-imports`](docs/rules/prefer-named-three-imports.md)             | `warn`      | 🔧  | Prefer named imports from `three` over `import * as THREE`; rewritten only when every use is a static member.                |
| [`prefer-three-load-async`](docs/rules/prefer-three-load-async.md)                   | `warn`      |     | Prefer `loader.loadAsync()` over the callback `load()` API.                                                                  |
| [`require-instance-buffer-update`](docs/rules/require-instance-buffer-update.md)     | `error`     | 🔧  | After `setMatrixAt()` / `setColorAt()`, set `instanceMatrix.needsUpdate` / `instanceColor.needsUpdate`.                      |
| [`require-projection-update`](docs/rules/require-projection-update.md)               | `error`     | 🔧  | After writing `camera.aspect`, call `camera.updateProjectionMatrix()` in the same function.                                  |
| [`require-three-dispose-contract`](docs/rules/require-three-dispose-contract.md)     | `error`     |     | A class that constructs GPU resources must declare a dispose method (`disposeMethodNames`, default `dispose`/`destroy`/`onModuleDestroy`). |
| [`require-three-loader-error-path`](docs/rules/require-three-loader-error-path.md)   | `error`     |     | A loader `.load(url, onLoad)` call must pass an `onError` callback (4th argument) or use `loadAsync()`.                      |

## Options

Only two rules take options:

```js
rules: {
  "three/no-unbounded-device-pixel-ratio": ["warn", { maxPixelRatio: 1.5 }],
  "three/require-three-dispose-contract": ["error", { disposeMethodNames: ["dispose", "teardown"] }],
}
```

## Limitations of static analysis

- **Binding resolution is lexical, not type-aware.** A receiver counts as a Three.js object when it is bound to `new <ThreeCtor>()` at module level, in the enclosing function or class, or is a parameter annotated with a Three.js type. Objects created elsewhere and passed in untyped are invisible.
- **`require-projection-update` / `require-instance-buffer-update` look within the enclosing function.** A `needsUpdate` write or `updateProjectionMatrix()` call in a different function is not seen.
- **`require-three-dispose-contract` only checks fields and constructor assignments.** Resources created lazily in other methods are not tracked.

## Development

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## License

MIT.
