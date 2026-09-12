# no-global-three

Do not rely on a global `THREE` identifier or `require("three")`. Import from the `three` package so the runtime is one module graph.

Recommended severity: `warn`. Autofix: no.

## ❌ Incorrect

```ts
const v = new THREE.Vector3(); // no import of THREE in this file
const THREE = require("three");
```

## ✅ Correct

```ts
import * as THREE from "three";
const v = new THREE.Vector3();
```

## Options

None.

## Detection

Any identifier spelled `THREE` that is not bound by an import from `three` (or `three/...`) is reported, except in declaration positions (import/export specifiers, member property names, qualified type names, and variable/function/class ids). `require()` calls whose argument is `"three"` or starts with `"three/"` are reported.
