# schema-files-must-not-import-driver

Disallow imports from database driver packages inside schema files.

## Rationale

Schema files are a structural blueprint shared across runtimes — backend services, edge functions, frontend type imports, migration tooling, test harnesses. The moment a schema file imports a connection driver (`pg`, `postgres`, `drizzle-orm/node-postgres`, etc.), it ties the schema package to a specific runtime, breaks edge-runtime portability, and pulls a multi-megabyte binary into bundles that should never have seen it.

Connection setup is the consuming application's responsibility. Schema files declare *what* the database looks like; they don't *open* connections.

The rule fires only on files matching `filePattern` (default `**/schema/**/*.schema.ts`). Files outside that pattern are untouched.

## ❌ Incorrect

```ts
// src/schema/users/users.schema.ts
import { drizzle } from "drizzle-orm/node-postgres";  // driver
import pg from "pg";                                    // driver
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", { id: uuid("id").primaryKey() });
export const db = drizzle(new pg.Pool());                // ← belongs in app code
```

## ✅ Correct

```ts
// src/schema/users/users.schema.ts
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull()
});

export const usersRelations = relations(users, ({ one }) => ({}));
```

```ts
// src/db/connection.ts (NOT a schema file — driver imports are fine here)
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }));
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePattern` | `string` (glob) | `**/schema/**/*.schema.ts` | Files this rule applies to. |
| `forbiddenSources` | `string[]` | See defaults below | Exact import-source strings that are blocked (`pg`, `postgres`, `mysql2`, etc.). |
| `forbiddenSourcePatterns` | `string[]` (globs) | See defaults below | Glob patterns matched against import sources, e.g. `drizzle-orm/aws-data-api/**`. |

### Default `forbiddenSources`

`pg`, `postgres`, `node-postgres`, `mysql2`, `better-sqlite3`, `@libsql/client`, `@neondatabase/serverless`, `@vercel/postgres`, `@planetscale/database`.

### Default `forbiddenSourcePatterns`

`drizzle-orm/node-postgres`, `drizzle-orm/postgres-js`, `drizzle-orm/neon-http`, `drizzle-orm/neon-serverless`, `drizzle-orm/vercel-postgres`, `drizzle-orm/aws-data-api/**`, `drizzle-orm/mysql2`, `drizzle-orm/planetscale-serverless`, `drizzle-orm/tidb-serverless`, `drizzle-orm/better-sqlite3`, `drizzle-orm/bun-sqlite`, `drizzle-orm/d1`, `drizzle-orm/expo-sqlite`, `drizzle-orm/libsql`, `drizzle-orm/op-sqlite`.

## Autofix

No.

## Version added

0.1.0
