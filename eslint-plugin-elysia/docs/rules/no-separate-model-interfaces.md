# no-separate-model-interfaces

Disallow TypeScript interfaces that duplicate the shape of a runtime schema with a matching name. Use `typeof Schema.static` (or your project's equivalent) instead.

## Rationale

When a runtime schema (TypeBox, Zod, Valibot) and a hand-written TypeScript interface coexist, they drift. A field added to the schema doesn't propagate to the interface; a field renamed in the interface still validates under the old schema name. The fix is to derive the type from the schema:

- TypeBox: `type User = typeof UserSchema.static`
- Zod: `type User = z.infer<typeof UserSchema>`
- Valibot: `type User = v.InferOutput<typeof UserSchema>`
- ArkType: `type User = typeof UserSchema.infer`

## ❌ Incorrect

```ts
import { t } from "elysia";

const UserSchema = t.Object({ id: t.String() });

interface User {
  id: string;
}
```

## ✅ Correct

```ts
import { t } from "elysia";

const UserSchema = t.Object({ id: t.String() });

type User = typeof UserSchema.static;
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schemaSuffixes` | `string[]` | `["Schema","Model","Dto","DTO","Request","Response"]` | Suffixes stripped from schema/interface names to compute their "base name". A schema named `UserSchema` and interface `User` collide on base `User`. |
| `schemaFactoryNames` | `string[]` | `["t.Object","Elysia.t.Object","Type.Object","z.object","v.object"]` | Call expressions that count as "creating a schema". Append `"type"` here for ArkType. |

## Limitations

- Name-only matching. `UserSchema` + `interface User` collide; `UserSchema` + `interface UserView` do not, even if they're semantically identical.
- AST-only — no cross-file detection.
- ArkType's bare `type(...)` factory is intentionally NOT in defaults to avoid false positives. Add `"type"` to `schemaFactoryNames` if your project uses ArkType.

## Autofix

No.

## Version added

0.1.0
