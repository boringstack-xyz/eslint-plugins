# require-instance-buffer-update

After `InstancedMesh.setMatrixAt()` / `setColorAt()`, set `instanceMatrix.needsUpdate` / `instanceColor.needsUpdate` so GPU buffers refresh.

Recommended severity: `error`. Autofix: inserts `<mesh>.instanceMatrix.needsUpdate = true;` (or `instanceColor`) after the enclosing loop, or after the statement when there is no loop.

## ❌ Incorrect

```ts
import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
for (let i = 0; i < 10; i++) {
  mesh.setMatrixAt(i, new Matrix4());
}
```

## ✅ Correct

```ts
import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
for (let i = 0; i < 10; i++) {
  mesh.setMatrixAt(i, new Matrix4());
}
mesh.instanceMatrix.needsUpdate = true;
```

## Options

None.

## Detection

The receiver must resolve to an `InstancedMesh` binding. The `needsUpdate` write is searched for within the enclosing function (or the module when top-level). One report per receiver, buffer and function.
