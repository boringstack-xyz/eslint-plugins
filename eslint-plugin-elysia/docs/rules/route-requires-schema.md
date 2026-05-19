# route-requires-schema

Require every Elysia route handler to declare at least one of `body`, `query`, `params`, `response`, `headers`, `cookie` schema in its options.

## Rationale

Elysia's typed runtime validation only fires when you declare a schema. Routes without one accept any input shape, return any output shape, and undermine the framework's main correctness guarantee. Pin every route to at least one schema.

## ❌ Incorrect

```ts
import { Elysia } from "elysia";
new Elysia().post("/users", (handler) => handler);
```

## ✅ Correct

```ts
import { Elysia, t } from "elysia";
new Elysia().post("/users", (handler) => handler, {
  body: t.Object({ email: t.String() })
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schemaKeys` | `string[]` | `["body","query","params","response","headers","cookie"]` | Property names that count as a schema. |
| `allowMethods` | `string[]` | `[]` | HTTP methods exempt from this rule (e.g., `["head"]`). |
| `ignorePathPattern` | `string` (regex) | `undefined` | Skip routes whose path matches this regex (e.g., `"^/internal/"`). |

## Autofix

No.

## Version added

0.1.0
