# consistent-status-via-set

Inside Elysia route handlers, set HTTP status via `set.status = N`, not by returning a `new Response(body, { status: N })`.

## Rationale

`set.status` is the Elysia idiom — it composes with the framework's serialization, response hooks, and typed error pipeline. Returning a manual `new Response(...)` bypasses all of that and produces inconsistencies (some routes set headers via `set.headers`, others via `Response`'s second arg) that subtly drift over time.

## ❌ Incorrect

```ts
new Elysia().get("/users/:id", () => {
  return new Response("not found", { status: 404 });
});
```

## ✅ Correct

```ts
new Elysia().get("/users/:id", ({ set }) => {
  set.status = 404;
  return { error: "not found" };
});
```

## Options

None.

## Autofix

No.

## Version added

0.1.0
