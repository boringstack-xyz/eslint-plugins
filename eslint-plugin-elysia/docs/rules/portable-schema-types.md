# portable-schema-types

In API contract schema files (`**/*.schemas.ts` by default), forbid Elysia schema shapes that the OpenAPI document or the generated client cannot carry faithfully.

## Rationale

The API's TypeBox schemas are the single source of truth for the UI client: `@elysiajs/swagger` publishes them and `openapi-typescript` turns the document into types. Three shapes survive validation but come out wrong on the other side:

| Shape | What the client sees | Why |
| --- | --- | --- |
| `t.Integer()` | `string \| number` | Elysia's `t.Integer` is a coercing type and publishes as `anyOf [{ type: "string", format: "integer" }, { type: "integer" }]`. |
| `t.Tuple([...])` | `T[]` in the success type, `[A, B]` in `operations` | OpenAPI 3.0 has no tuple; the two "same" types become incompatible in `useQuery`. |
| `t.Union(values.map(...))` | the static type is `undefined` | `.map()` returns an array, not a tuple, so TypeBox cannot keep the literal members. |

## ❌ Incorrect

```ts
import { t } from "elysia";

export const Resistor = t.Object({ resistanceOhm: t.Integer() });
export const Pair = t.Tuple([t.String(), t.String()]);
export const Status = t.Union(STATUSES.map((s) => t.Literal(s)));
```

## ✅ Correct

```ts
import { t } from "elysia";
import { Type } from "@sinclair/typebox";

export const Resistor = t.Object({ resistanceOhm: Type.Integer() });
export const Pair = t.Array(t.String());
export const Status = t.UnionEnum([...STATUSES]);
```

`t.Numeric()` stays the right tool for query and path parameters, which arrive as strings; env parsing files are outside the default glob for the same reason.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fileGlob` | `string` | `"**/*.schemas.ts"` | Files treated as API contract schemas. |

## Autofix

None: the replacement depends on whether the field is JSON or a string parameter.
