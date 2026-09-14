# require-three-loader-error-path

A Three.js loader `.load(url, onLoad)` call must pass an `onError` callback (4th argument), or prefer `loadAsync()` and handle the rejection.

Recommended severity: `error`. Autofix: no.

## ❌ Incorrect

```ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
loader.load("/model.glb", (gltf) => use(gltf));
```

## ✅ Correct

```ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
loader.load("/model.glb", (gltf) => use(gltf), undefined, (err) => report(err));
// or
const gltf = await loader.loadAsync("/model.glb");
```

## Options

None.

## Detection

Flags `.load()` calls with two or three arguments whose receiver resolves to a `*Loader` binding from `three`.
