# no-disabled-frustum-culling

Leave `Object3D.frustumCulled` at its default (`true`) unless a custom shader invalidates geometric bounds. Disabling it is a measurable extra draw.

Recommended severity: `warn`. Autofix: no.

## ❌ Incorrect

```ts
import { Mesh } from "three";
const mesh = new Mesh();
mesh.frustumCulled = false;
```

## ✅ Correct

```ts
import { Mesh } from "three";
const mesh = new Mesh();
// default culling; or compute correct bounds instead of disabling culling
mesh.geometry.computeBoundingSphere();
```

## Options

None.

## Detection

Only the literal `false` is flagged, and only when the receiver resolves to a Three.js `Object3D`-like binding.
