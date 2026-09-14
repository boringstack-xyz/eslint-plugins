# no-unbounded-device-pixel-ratio

Do not pass unbounded `window.devicePixelRatio` to `setPixelRatio`. Cap it so high-DPI displays cannot explode GPU memory.

Recommended severity: `warn`. Autofix: wraps the argument in `Math.min(window.devicePixelRatio, <maxPixelRatio>)`.

## ❌ Incorrect

```ts
import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
```

## ✅ Correct

```ts
import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

## Options

```json
{ "maxPixelRatio": 2 }
```

- `maxPixelRatio` (number, minimum `0.5`, default `2`): the cap written by the autofix and shown in the message.

## Detection

Only a bare `window.devicePixelRatio` argument to a `.setPixelRatio()` call is flagged, and only in files that import from `three`.
