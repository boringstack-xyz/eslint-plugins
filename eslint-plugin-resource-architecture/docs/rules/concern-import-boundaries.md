# concern-import-boundaries

Enforces concern-specific import restrictions based on the current file name:

- `*.schemas.ts`   → must not import ORM or DB clients\n- `*.types.ts`     → must not import framework code or `*.schemas` modules\n- `*.service.ts`   → must not import framework code\n- `*.routes.ts`    → must not import ORM or DB clients\n- `*.constants.ts` → must not import framework, ORM, or DB clients\n+
## Rationale

This rule is a declarative version of common `no-restricted-imports` blocks. It prevents accidental layering violations by making file suffixes carry architectural meaning.

## Examples

❌ Invalid (`*.types.ts` importing framework):

```ts
import { Elysia } from "elysia";
```

✅ Valid (`*.types.ts` exporting types only):

```ts
export type UserId = string;
```

## Options

- `framework` (default: `["elysia","@elysiajs/*"]`)\n- `orm` (default: `["drizzle-orm"]`)\n- `dbClientPattern` (default: `"**/clients/postgres/**"`)

## Autofix

No.

## Version

Added in `0.1.0`.

