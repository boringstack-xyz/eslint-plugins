# eslint-plugin-drizzle-conventions

[![CI](https://github.com/agjs/eslint-plugin-drizzle-conventions/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-drizzle-conventions/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint plugin enforcing schema-quality and organization conventions for [Drizzle ORM](https://orm.drizzle.team/).

## Why

Drizzle gives you a typed schema, but nothing in the type system tells you that every table needs `createdAt`/`updatedAt`, that every `foreignKey(...)` needs a matching `relations(...)` call, that raw `sql\`\`` is a back door past your guarantees, or that schema files should not double as a service dumping ground. These four rules pin those invariants down at lint time so they don't drift.

## Install

```sh
pnpm add -D eslint-plugin-drizzle-conventions
```

## Usage (flat config)

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import drizzleConventions from "eslint-plugin-drizzle-conventions";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: { "drizzle-conventions": drizzleConventions },
    rules: drizzleConventions.configs.recommended.rules
  }
];
```

The recommended preset enables all four rules at `"error"`. To configure individual rules, replace the `rules:` block with explicit entries:

```js
rules: {
  "drizzle-conventions/tables-must-have-timestamps": [
    "error",
    { requireColumns: ["createdAt", "updatedAt", "deletedAt"] }
  ],
  "drizzle-conventions/no-raw-sql-outside-allowlist": [
    "error",
    { allowFiles: ["**/migrations/**", "**/raw/**", "**/reports/**"] }
  ]
}
```

## Rules

| Rule | Category | Description |
|------|----------|-------------|
| [`tables-must-have-timestamps`](docs/rules/tables-must-have-timestamps.md) | Convention | Tables must declare timestamp columns (`createdAt`, `updatedAt`); optional `requireOnUpdate` enforces `.$onUpdate(...)`. |
| [`timestamp-must-specify-mode`](docs/rules/timestamp-must-specify-mode.md) | Correctness | Every `timestamp(...)` must pin `mode: 'date'` or `mode: 'string'` so return types are deterministic across drivers. |
| [`relations-must-cover-fks`](docs/rules/relations-must-cover-fks.md) | Correctness | Every table that declares a `foreignKey(...)` needs a matching `relations(...)` call in the same file. |
| [`no-raw-sql-outside-allowlist`](docs/rules/no-raw-sql-outside-allowlist.md) | Safety | Disallow drizzle-orm `sql` tagged templates outside an allowlist (migrations, raw queries by default). |
| [`no-nested-db-transaction`](docs/rules/no-nested-db-transaction.md) | Correctness | Inside a `db.transaction(async (tx) => …)` callback, forbid `db.transaction(...)`; use `tx.transaction(...)` instead. |
| [`schema-files-must-only-export-schema`](docs/rules/schema-files-must-only-export-schema.md) | Convention | Schema files (`**/schema/**/*.schema.ts` by default) may only export schema artifacts and types. |
| [`schema-files-must-not-import-driver`](docs/rules/schema-files-must-not-import-driver.md) | Boundary | Schema files must not import database driver packages (`pg`, `drizzle-orm/node-postgres`, etc.) — keeps them runtime-portable. |

### tables-must-have-timestamps

Options: `{ requireColumns?: string[]; requireOnUpdate?: string[]; ignoreTablePattern?: string }`

```ts
// ❌
export const users = pgTable("users", { id: uuid("id").primaryKey() });

// ✅
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date())
});
```

`requireOnUpdate` is opt-in. Without `.$onUpdate(...)`, `updatedAt` does not auto-update on row mutation. Recommended override:

```js
"drizzle-conventions/tables-must-have-timestamps": [
  "error",
  { requireOnUpdate: ["updatedAt"] }
]
```

### timestamp-must-specify-mode

Options: `{ allowedModes?: ("date" | "string")[] }`

```ts
// ❌  return type drifts across drivers
createdAt: timestamp("created_at").notNull();

// ✅
createdAt: timestamp("created_at", { mode: "date" }).notNull();
```

### relations-must-cover-fks

Options: `{ allowExternalFile?: boolean }` (default `false`).

```ts
// ❌
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey(),
  authorFk: foreignKey({ columns: [], foreignColumns: [] })
});

// ✅
export const posts = pgTable("posts", { /* ... */ });
export const postsRelations = relations(posts, ({ one }) => ({}));
```

Single-file detection only; cross-file relation detection is out of scope without parser services.

### no-raw-sql-outside-allowlist

Options: `{ allowFiles?: string[] }` (default `["**/migrations/**", "**/raw/**"]`).

```ts
// ❌  src/services/users.service.ts
import { sql } from "drizzle-orm";
export const ban = sql`UPDATE users SET banned = true`;

// ✅  src/db/migrations/0001-init.ts
import { sql } from "drizzle-orm";
export const up = sql`CREATE TABLE users (id text)`;
```

### no-nested-db-transaction

Options: `{ transactionMethod?: string }` (default `"transaction"`).

```ts
// ❌
await db.transaction(async (tx) => {
  await db.transaction(async (innerTx) => {});  // races, deadlocks on poolers
});

// ✅
await db.transaction(async (tx) => {
  await tx.transaction(async (innerTx) => {});  // savepoint on the same connection
});
```

### schema-files-must-not-import-driver

Options: `{ filePattern?: string; forbiddenSources?: string[]; forbiddenSourcePatterns?: string[] }`

Schema files must remain runtime-agnostic — driver imports (`pg`, `drizzle-orm/node-postgres`, etc.) belong in the consuming application, not the schema package.

```ts
// ❌  src/schema/users/users.schema.ts
import { drizzle } from "drizzle-orm/node-postgres";

// ✅  src/schema/users/users.schema.ts
import { pgTable } from "drizzle-orm/pg-core";
```

### schema-files-must-only-export-schema

Options: `{ filePattern?: string }` (default `**/schema/**/*.schema.ts`).

```ts
// ❌  src/schema/users/users.schema.ts
export class UsersService {}            // class
export const helper = () => 1;           // arrow const

// ✅  src/schema/users/users.schema.ts
export const users = pgTable("users", { /* ... */ });
export const usersRelations = relations(users, ({ one }) => ({}));
export type User = typeof users.$inferSelect;
```

## Development

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## License

MIT.
