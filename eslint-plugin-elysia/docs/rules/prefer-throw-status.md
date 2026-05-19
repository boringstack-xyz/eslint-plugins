# prefer-throw-status

Inside Elysia route handlers, prefer `throw status(...)` over try/catch blocks that build their own Response — local catches bypass Elysia's typed `onError` pipeline.

## Rationale

A try/catch inside a route handler that builds its own `Response` (or sets `set.status` and returns a literal) re-implements what Elysia's `onError` pipeline already does — but without the typing, without consistency across routes, and without composability with the rest of the plugin chain. Throwing `status(code, message)` (or your project's typed exception) flows through `onError` where shared logic lives.

## ❌ Incorrect

```ts
new Elysia().get("/users/:id", ({ params }) => {
  try {
    return loadUser(params.id);
  } catch (e) {
    return new Response("not found", { status: 404 });
  }
});
```

## ✅ Correct

```ts
import { Elysia, status } from "elysia";

new Elysia().get("/users/:id", ({ params }) => {
  const user = loadUser(params.id);
  if (!user) throw status(404, "not found");
  return user;
});
```

## When the rule does NOT fire

Catch blocks that only log/audit (no return, no manual response) are fine — they're legitimate background error swallowers:

```ts
new Elysia().post("/users", async ({ body }) => {
  try {
    await audit(body);
  } catch (error) {
    logger.warn(error); // ← OK
  }
  return service.create(body);
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxStatements` | `number` | `3` | Try blocks larger than this trigger the rule even without a catch-builds-response heuristic. |

## Limitations

- Heuristic. The rule doesn't autofix because the right replacement (which `status` to throw, which message) is contextual.
- Catches that sometimes log and sometimes return are flagged conservatively.

## Autofix

No.

## Version added

0.1.0
