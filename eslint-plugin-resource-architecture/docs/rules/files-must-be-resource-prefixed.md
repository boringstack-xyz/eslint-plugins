# files-must-be-resource-prefixed

Enforces a resource-prefixed filename convention under a resource root (default: `src/api/<resource>/`).

When a file is named only by concern (e.g. `routes.ts`, `service.ts`, `schemas.ts`), it must be renamed to include the resource name (e.g. `users.routes.ts`).

## Rationale

Resource-prefixed concerns make cross-file navigation and search more deterministic, and reduce ambiguity when files are opened outside their folder context.

## Examples

❌ Invalid:

```ts
// src/api/users/routes.ts
export const usersRoutes = {};
```

✅ Valid:

```ts
// src/api/users/users.routes.ts
export const usersRoutes = {};
```

## Options

- `rootGlob` (default: `"src/api"`) — directory prefix used to detect resource folders.
- `suffixes` (default: `["routes","service","schemas","types","utils","constants","plugin"]`)
- `allowExceptions` (default: `["index.ts"]`)

## Autofix

No.

## Version

Added in `0.1.0`.

