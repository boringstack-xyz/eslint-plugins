---
"@boring-stack-pkg/eslint-plugin-elysia": minor
---

New rule `portable-schema-types`: in API contract schema files (`**/*.schemas.ts` by default) it reports Elysia's coercing `t.Integer()` (published as `anyOf [string, integer]`, typed `string | number` by the generated client), `t.Tuple()` (no OpenAPI 3.0 representation; the client widens it) and `t.Union(values.map(...))` (static type collapses to `undefined`). Each message names the portable replacement: `Type.Integer()` from `@sinclair/typebox`, `t.Array()`, `t.UnionEnum()`.
