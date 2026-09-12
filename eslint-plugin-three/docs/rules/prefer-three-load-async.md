# prefer-three-load-async

Prefer `loader.loadAsync()` over the callback `load()` API so failures compose with typed Promises and `no-floating-promises`.

Recommended severity: `warn`. Autofix: no (converting callbacks may require making the enclosing function `async`).

## ❌ Incorrect

```ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
loader.load("/model.glb", (gltf) => use(gltf), undefined, (err) => { throw err; });
```

## ✅ Correct

```ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
const gltf = await loader.loadAsync("/model.glb");
```

## Options

None.

## Detection

Flags `.load()` calls with two or more arguments whose receiver resolves to a binding created with a Three.js constructor named `*Loader` (or a parameter annotated with such a type).
