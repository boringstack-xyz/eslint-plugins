# prefer-destructured-context

Prefer destructured context (`{ body, set, ... }`) over passing the entire dynamic Elysia context object into controllers/services.

## Rationale

Elysia's `Context` is dynamically composed — its shape depends on the active plugins, decorations, derives, and resolves at the route's chain position. Passing the whole context into a service or controller:

- Couples the service signature to Elysia's internal type.
- Slows TypeScript inference on every call site.
- Makes it impossible to test the service without constructing a fake Elysia context.

Destructure only the fields the service needs at the route boundary, then call with concrete primitives or domain objects.

## ❌ Incorrect

```ts
new Elysia().post("/users", (ctx) => controller.create(ctx));
```

## ✅ Correct

```ts
new Elysia().post("/users", ({ body, set }) => controller.create({ body }));
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowNames` | `string[]` | `[]` | Parameter names that are exempt from this rule (e.g., `["request"]` if your project's convention uses `request` deliberately for that). |

## Limitations

- AST-only. Aliasing the parameter (`const c = ctx; helper(c)`) defeats the check.
- Member access (`ctx.body`) and inline object destructuring at use sites (`{ body: ctx.body }`) are intentionally NOT flagged — they're fine usages.

## Autofix

No.

## Version added

0.1.0
