# no-direct-db-in-tests

Disallow direct DB / driver imports from test files.

## Why

When tests reach into the DB driver directly they bypass the helpers
entrypoint where you do connection probing, schema checks, transaction
isolation, and cleanup. Tests pass locally, the pool gets corrupted in CI,
and a flaky run is born. Force every test to go through one entrypoint.

## How it works

If the current file matches `testFiles` (default: `tests/**/*.ts`,
`**/*.test.ts`, `**/*.spec.ts`), any import / re-export / dynamic import
whose source matches `forbiddenPaths` is reported. Imports that resolve to
the configured `helpersPath` (the helpers entrypoint itself) are allowed.

The helpers file at `helpersPath` is itself exempt from the rule — that's
the one place that's allowed to import the driver.

## Options

```ts
{
  testFiles?: string[];        // default: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"]
  forbiddenPaths?: string[];   // default: ["**/clients/postgres/**", "**/db/**", "drizzle-orm"]
  helpersPath?: string;        // default: "tests/helpers/db"
}
```

`forbiddenPaths` entries with wildcard characters are matched as globs
(contains-mode, so `**/db/**` matches relative imports like
`../../src/db/schema`). Bare specifiers (no wildcards) match exact-equal
or prefix-with-`/`.

## Examples

`tests/users/users.test.ts`:

```ts
// valid — goes through the helpers entrypoint
import { withDb } from "../helpers/db";

// valid — unrelated module
import { z } from "zod";

// invalid — direct driver import
import { drizzle } from "drizzle-orm";

// invalid — reaching past helpers into the db schema
import * as schema from "../../src/db/schema";
```
