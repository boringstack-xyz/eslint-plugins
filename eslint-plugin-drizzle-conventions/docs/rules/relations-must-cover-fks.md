# relations-must-cover-fks

Every Drizzle table that declares a `foreignKey(...)` must also have a `relations(...)` call covering it in the same file.

## Rationale

A foreign key is only half of a relationship — without a `relations(...)` call, the typed query API can't traverse it. Catch the gap at lint time so it doesn't show up as a runtime "I thought we could `.with({ author: true })`" surprise.

This rule is single-file by design. Cross-file detection requires parser services and is out of scope. If you organize relations in sibling files, set `allowExternalFile: true` to disable the check.

## ❌ Incorrect

```ts
import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey(),
  authorFk: foreignKey({ columns: [], foreignColumns: [] })
});
// ↑ posts declares foreignKey but no relations(posts, ...) in this file
```

## ✅ Correct

```ts
import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const posts = pgTable(
  "posts",
  { id: uuid("id").primaryKey() },
  (table) => [foreignKey({ columns: [table.id], foreignColumns: [] })]
);

export const postsRelations = relations(posts, ({ one }) => ({}));
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowExternalFile` | `boolean` | `false` | When `true`, suppress the rule entirely (use if your project keeps `relations(...)` calls in dedicated files). |

## Autofix

No.

## Version added

0.1.0
