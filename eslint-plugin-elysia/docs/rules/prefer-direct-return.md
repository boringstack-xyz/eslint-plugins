# prefer-direct-return

Inside Elysia route handlers, return values directly instead of wrapping them in `new Response(...)` or `Response.json(...)` — Elysia handles serialization and content-type automatically.

## Rationale

Elysia's response pipeline serializes the returned value, sets `content-type` based on the response schema (or inference), and applies `mapResponse` hooks. Wrapping in `new Response(JSON.stringify(...))` opts out of all of that and produces inconsistent content-type behavior across routes.

## ❌ Incorrect

```ts
new Elysia().get("/users", () => new Response("ok"));
new Elysia().get("/json", () => Response.json({ ok: true }));
new Elysia().post("/x", () => {
  return new Response(JSON.stringify({ ok: true }));
});
```

## ✅ Correct

```ts
new Elysia().get("/users", () => "ok");
new Elysia().get("/json", () => ({ ok: true }));
```

## When `new Response(...)` IS appropriate

The rule allows manual `Response` construction when you genuinely need raw platform behavior — streams, files, custom headers/content-type:

```ts
// Stream — only Response can carry it
new Elysia().get("/stream", () => new Response(stream));

// Custom headers — Response is the conventional way
new Elysia().get("/csv", () =>
  new Response(buildCsv(), { headers: { "content-type": "text/csv" } })
);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowWithHeaders` | `boolean` | `true` | When `true`, `new Response(body, { headers })` is allowed. Set to `false` for stricter enforcement (use Elysia's `set.headers` instead). |

## Autofix

No.

## Version added

0.1.0
