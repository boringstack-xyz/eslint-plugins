# timestamp-must-specify-mode

Require every Drizzle `timestamp(...)` column to explicitly set `mode: 'date'` or `mode: 'string'`.

## Rationale

`timestamp(...)` returns *different runtime types depending on the underlying driver*. Without a `mode` specified, you may get a JavaScript `Date` from one driver and an ISO string from another. The application code that calls `.toISOString()`, compares with `<`, or feeds the value into a JSON response works correctly in dev and breaks in production — silently, and only on rows that have been written or read in particular ways.

Pinning `mode` removes the ambiguity. Drizzle coerces the driver's response to your declared shape regardless of which adapter the connection uses.

## ❌ Incorrect

```ts
import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  // ↓ return type drifts between drivers
  createdAt: timestamp("created_at").notNull()
});
```

## ✅ Correct

```ts
import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull()
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowedModes` | `("date" \| "string")[]` | `["date", "string"]` | Restrict to a subset (e.g., `["date"]` to enforce a single project-wide convention). |

## Autofix

No.

## Version added

0.1.0
