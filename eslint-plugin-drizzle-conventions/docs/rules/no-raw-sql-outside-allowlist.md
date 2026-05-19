# no-raw-sql-outside-allowlist

Disallow drizzle-orm `sql` tagged template literals outside an allowlist of files (migrations, raw queries by default).

## Rationale

`sql\`\`` is the back door past Drizzle's type system and parameter-escape guarantees. Every use site is a potential injection footgun and a place type-changes won't propagate. It belongs in migrations and dedicated raw-query modules — not sprinkled across services.

The rule tracks the `sql` binding's local name (so `import { sql as raw }` is flagged correctly) and only fires when the import source is `drizzle-orm`.

## ❌ Incorrect

```ts
// src/services/users.ts
import { sql } from "drizzle-orm";

export const ban = sql`UPDATE users SET banned = true`;
```

## ✅ Correct

```ts
// src/db/migrations/0001-init.ts
import { sql } from "drizzle-orm";

export const up = sql`CREATE TABLE users (id text)`;
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowFiles` | `string[]` | `["**/migrations/**", "**/raw/**"]` | Glob patterns of files where raw `sql` is allowed. Matched against the absolute filename ESLint passes to the rule. |

Glob syntax supports `**`, `*`, `?` and literal segments.

## Autofix

No.

## Version added

0.1.0
