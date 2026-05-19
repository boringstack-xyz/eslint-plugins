# route-requires-tag

Require every Elysia route to declare `detail.tags` for Swagger grouping.

## Rationale

`@elysiajs/swagger` groups operations in the generated docs by their `detail.tags`. Routes without tags fall into a default bucket — invisible to consumers reading the spec, hard to search. Mandating tags forces every route to have an owner-domain in the API surface.

## ❌ Incorrect

```ts
new Elysia().get("/users", listUsers);
new Elysia().post("/users", createUser, { body: UserSchema });
```

## ✅ Correct

```ts
new Elysia().get("/users", listUsers, { detail: { tags: ["Users"] } });
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ignorePathPattern` | `string` (regex) | `undefined` | Skip routes whose path matches this regex. |

## Autofix

No.

## Version added

0.1.0
