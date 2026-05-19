# no-direct-process-env

Disallow direct `process.env` access. Force every consumer through a typed,
boot-validated singleton.

## Why

Reading `process.env.X` directly bypasses the boot-time schema check, returns
`string | undefined` (so consumers either ignore the undefined case or paper
over it ad-hoc), and scatters defaults across the codebase. A central
validated singleton means: missing keys fail at boot, type-narrowing happens
once, and defaults live in one file.

## Patterns flagged

- `process.env.X` (read or write)
- `process.env["X"]` (computed)
- `const { X, Y } = process.env` (destructure)
- `({ X } = process.env)` (assignment-pattern destructure)

## Options

```ts
{
  allowedFiles?: string[];        // default: ["src/config/env/**", "**/*.config.{ts,js,mjs}", "scripts/**"]
  singletonSuggestion?: string;   // default: "import { env } from '@/config/env'"
}
```

`allowedFiles` is where the singleton itself lives, plus build-time configs
and one-shot scripts where the validated shape isn't worth the import dance.

## Examples

Valid:

```ts
// src/services/users.ts
import { env } from "@/config/env";
const port = env.PORT;
```

Invalid (in `src/services/users.ts`):

```ts
const port = process.env.PORT;
const port = process.env["PORT"];
const { PORT, DATABASE_URL } = process.env;
process.env.NODE_ENV = "test";
```
