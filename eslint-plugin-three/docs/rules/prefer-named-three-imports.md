# prefer-named-three-imports

Prefer named imports from `three` over `import * as THREE`. Named imports make dependencies visible and tree-shakeable.

Recommended severity: `warn`. Autofix: rewrites the import to `import { A, B } from "three"` and every `THREE.A` to `A`, but only when it is safe (see below).

## ❌ Incorrect

```ts
import * as THREE from "three";
const v = new THREE.Vector3();
```

## ✅ Correct

```ts
import { Vector3 } from "three";
const v = new Vector3();
```

## Options

None.

## Detection

Both `import * as THREE` and a default import from `three` are reported. The fix is only offered when every use of the namespace is a static member access (`THREE.X` or type `THREE.X`), no accessed member name is already declared in the file, and there is no second value import from `three`.
