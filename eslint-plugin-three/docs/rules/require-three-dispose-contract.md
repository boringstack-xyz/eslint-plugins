# require-three-dispose-contract

A class that constructs Three.js GPU resources (geometry, material, texture, renderer, render target, `DRACOLoader`, `KTX2Loader`) must declare a dispose/destroy method. Dropping the JS reference does not free VRAM.

Recommended severity: `error`. Autofix: no.

## ❌ Incorrect

```ts
import { BoxGeometry, MeshBasicMaterial } from "three";
class GridView {
  private geometry = new BoxGeometry();
  private material = new MeshBasicMaterial();
}
```

## ✅ Correct

```ts
import { BoxGeometry } from "three";
class GridView {
  private geometry = new BoxGeometry();
  dispose() {
    this.geometry.dispose();
  }
}
```

## Options

```json
{ "disposeMethodNames": ["dispose", "destroy", "onModuleDestroy"] }
```

- `disposeMethodNames` (non-empty array of unique strings): method names that satisfy the contract.

## Detection

A class owns a GPU resource when a field initializer or a `this.x = ...` assignment inside the constructor is `new <GpuCtor>()` from `three`. Constructor-injected (borrowed) resources are not counted.
