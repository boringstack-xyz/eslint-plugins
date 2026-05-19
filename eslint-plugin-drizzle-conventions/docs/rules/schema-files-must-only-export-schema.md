# schema-files-must-only-export-schema

Restrict schema files (default: `**/schema/**/*.schema.ts`) to exporting only Drizzle schema artifacts and TypeScript types.

## Rationale

Schema files are a structural boundary. When they double as utility dumping grounds, you get import cycles between schema and runtime code, and refactor friction every time you split a service. Forbid the pattern at the file level — services and helpers go elsewhere.

Allowed exports:

- `pgTable(...)`, `<schema>.table(...)`
- `pgSchema(...)`
- `relations(...)`
- `foreignKey(...)`, `primaryKey(...)`, `index(...)`, `unique(...)`
- `type` aliases
- `interface` declarations
- Re-exports (`export { ... } from "..."` / `export type { ... } from "..."`)

Anything else (classes, functions, arrow consts, object literals, default exports) is reported.

## ❌ Incorrect

```ts
// src/schema/users/users.schema.ts
export class UsersService {}                  // class
export const helper = () => 1;                 // arrow const
export const userDefaults = { active: true }; // object literal
export default function buildUser() {}        // default export
```

## ✅ Correct

```ts
// src/schema/users/users.schema.ts
import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const usersRelations = relations(users, ({ one }) => ({}));

export type User = typeof users.$inferSelect;
export interface UserView { id: string; }

export type { User as ReExportedUser } from "./other";
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePattern` | `string` (glob) | `**/schema/**/*.schema.ts` | Files this rule applies to. Files not matching are ignored. |

## Autofix

No.

## Version added

0.1.0
