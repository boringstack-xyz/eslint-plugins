# no-cross-resource-internal-imports

Disallows importing internal files across resources under a shared resource root (default: `src/api/<resource>/`).

Cross-resource imports are allowed only when they target a resource’s public surface (default: `index.ts` and `*.routes.ts`).

## Rationale

This keeps resources encapsulated and makes “what is public” explicit.

## Examples

✅ Valid (import public surface):

```ts
import { projectRoutes } from "../projects/projects.routes";
```

❌ Invalid (import internal file):

```ts
import { projectService } from "../projects/projects.service";
```

## Options

- `rootGlob` (default: `"src/api"`)\n- `publicSurface` (default: `["index.ts","*.routes.ts"]`)

## Autofix

No.

## Version

Added in `0.1.0`.

