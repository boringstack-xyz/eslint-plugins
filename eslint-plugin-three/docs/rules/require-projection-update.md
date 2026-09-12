# require-projection-update

After writing `camera.aspect`, call `camera.updateProjectionMatrix()` so the view frustum matches the new aspect ratio.

Recommended severity: `error`. Autofix: appends `; <camera>.updateProjectionMatrix()` after the assignment.

## ❌ Incorrect

```ts
import { PerspectiveCamera } from "three";
const camera = new PerspectiveCamera();
camera.aspect = width / height;
```

## ✅ Correct

```ts
import { PerspectiveCamera } from "three";
const camera = new PerspectiveCamera();
camera.aspect = width / height;
camera.updateProjectionMatrix();
```

## Options

None.

## Detection

The receiver must resolve to a Three.js camera binding (`Camera`, `PerspectiveCamera`, `OrthographicCamera`, `ArrayCamera`, `CubeCamera`, `StereoCamera`). The `updateProjectionMatrix()` call is searched for within the enclosing function.
