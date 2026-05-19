# env-var-must-have-schema-entry

Every `env.X` access must correspond to a key declared in the env schema
file. Catches typos at lint time before they reach boot.

## Why

When the env singleton is built from a schema (TypeBox / Zod / etc.) and
the inferred type isn't always available cross-package, a typo like
`env.DATBASE_URL` slips through tsc. This rule reads the schema file from
disk and confirms the key exists.

## How it works

For each `<id>.<KEY>` access, the rule resolves whether `<id>` is a local
binding for the singleton imported from `singletonImportPath` (matching
imported name `singletonName`, default `env`). If yes, it reads the
`schemaFile` (cached by mtime) and runs the configured `schemaPattern`
regex over its contents to extract declared keys.

The default pattern (`^\s*([A-Z][A-Z0-9_]*)\s*:`) recognizes any
top-level `KEY:` line under the schema file — works for TypeBox, Zod,
plain object literals, etc. Override `schemaPattern` if your schema uses
a different shape.

The schema reader is exposed through `setSchemaReaderForTesting` for unit
tests of consumers of this rule.

## Options

```ts
{
  singletonImportPath?: string;   // default: "@/config/env"
  singletonName?: string;         // default: "env"
  schemaFile?: string;            // default: "src/config/env/schema.ts"
  schemaPattern?: string;         // default: "^\\s*([A-Z][A-Z0-9_]*)\\s*:"
}
```

## Examples

Schema (`src/config/env/schema.ts`):

```ts
export const envSchema = Type.Object({
  NODE_ENV: Type.String(),
  PORT: Type.Number(),
  DATABASE_URL: Type.String()
});
```

Valid:

```ts
import { env } from "@/config/env";
const port = env.PORT;
const url = env.DATABASE_URL;
```

Invalid:

```ts
import { env } from "@/config/env";
const port = env.TYPO;          // not in schema
const env2 = env.NODEENV;       // missing underscore
```
