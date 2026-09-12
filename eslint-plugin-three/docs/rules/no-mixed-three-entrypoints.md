# no-mixed-three-entrypoints

Import Three.js only from `three` and `three/addons/...`. The legacy `three/examples/jsm/` path, `three/src/`, `three/build/`, and CDN URLs create duplicate library instances.

Recommended severity: `error`. Autofix: `three/examples/jsm/<path>` → `three/addons/<path>`. `three/src/`, `three/build/` and CDN sources are reported without a fix.

## ❌ Incorrect

```ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Scene } from "three/src/scenes/Scene.js";
import * as THREE from "https://unpkg.com/three/build/three.module.js";
```

## ✅ Correct

```ts
import { Scene } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
```

## Options

None.

## Detection

Checks `import`, `export ... from`, `export * from`, dynamic `import()` with a string literal, and `require()` with a string literal.
