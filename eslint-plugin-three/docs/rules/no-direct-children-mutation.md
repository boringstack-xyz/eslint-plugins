# no-direct-children-mutation

Do not mutate `Object3D.children` as an array. Use `add()` / `remove()` so Three.js hierarchy bookkeeping stays consistent.

Recommended severity: `error`. Autofix: `x.children.push(a, b)` → `x.add(a, b)`. Other mutations (`splice`, `unshift`, `pop`, `shift`, `children = ...`, `children[i] = ...`) are reported without a fix.

## Rationale

`Object3D.add()` sets `child.parent`, removes the child from its previous parent, and dispatches `added`/`removed` events. Pushing onto `children` directly skips all of that, so raycasting, matrix updates and disposal see an inconsistent graph.

## ❌ Incorrect

```ts
import { Scene, Mesh } from "three";
const scene = new Scene();
scene.children.push(new Mesh());
scene.children.splice(0, 1);
```

## ✅ Correct

```ts
import { Scene, Mesh } from "three";
const scene = new Scene();
const mesh = new Mesh();
scene.add(mesh);
scene.remove(mesh);
```

## Options

None.

## Detection

The receiver must resolve to a binding created with a Three.js `Object3D`-like constructor (anything imported from `three` that is not a math class, loader, or GPU resource). Plain objects with a `children` array are ignored.
