# tables-must-have-timestamps

Require Drizzle tables to declare standard timestamp columns (`createdAt`, `updatedAt` by default), each defined via `timestamp(...)`.

## Rationale

Audit-trail columns are the lowest-cost form of observability you get from a schema. Drift on this is silent — a single table without `createdAt`/`updatedAt` is exactly the row your future investigation will need. Pin it at the schema level instead of relying on review.

## ❌ Incorrect

```ts
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey()
});
```

## ✅ Correct

```ts
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requireColumns` | `string[]` | `["createdAt", "updatedAt"]` | Property names that must exist on each table and be initialized via a `timestamp(...)` call. |
| `requireOnUpdate` | `string[]` | `[]` | Columns in this list, when present, must include `.$onUpdate(...)` (or `.$onUpdateFn(...)`) somewhere in their initializer chain so they auto-update on row mutation. Opt-in. |
| `ignoreTablePattern` | `string` (regex) | `undefined` | Skip tables whose variable name matches this regex (e.g., `"^_"` to skip `_migrations`). |

### `requireOnUpdate`

A `timestamp("updated_at").notNull()` column does **not** auto-update — it only sets a value at insert (or via `.defaultNow()`). Drizzle exposes `.$onUpdate(() => new Date())` to flip Drizzle's mutation builder into auto-touching the column. Stale `updatedAt` values are silent and corrupting; turn this on for any column you expect to track row mutations.

```ts
// Recommended override
"drizzle-conventions/tables-must-have-timestamps": [
  "error",
  { requireOnUpdate: ["updatedAt"] }
]
```

## Autofix

No.

## Version added

0.1.0
