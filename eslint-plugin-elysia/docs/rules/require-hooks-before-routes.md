# require-hooks-before-routes

Elysia hooks (`onError`, `onBeforeHandle`, etc.) must register before any route methods on the same instance — top-down waterfall semantics mean a hook registered after a route does not apply to it.

## Rationale

Elysia composes lifecycle by registration order. A hook registered AFTER a route is silently scoped to subsequent routes only, leaving earlier routes uncovered. The earlier route's request flow runs without the hook — including critical hooks like `onError` and `onBeforeHandle` for auth.

The rule fires on `<chain>.onError(...)` after `<chain>.get(...)`/`.post(...)`/etc. — both in chained builders and in flat builder sequences (`app.get(...); app.onError(...)`).

## ❌ Incorrect

```ts
new Elysia()
  .get("/health", () => "ok")
  .onError(({ error }) => console.error(error)); // never fires for /health
```

```ts
const app = new Elysia();
app.get("/users", listUsers);
app.onError(handleError); // never fires for /users
```

## ✅ Correct

```ts
new Elysia()
  .onError(({ error }) => console.error(error))
  .get("/health", () => "ok");
```

## Local route-options hooks are NOT flagged

Hooks passed as part of a route's options bag are scoped to *that* route by design and don't participate in waterfall ordering:

```ts
new Elysia()
  .get("/users", listUsers, { beforeHandle: requireAuth }) // ← OK; route-local
  .onError(handleError); // ← still flagged — global hook AFTER route
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hooks` | `string[]` | All Elysia lifecycle hooks (`onRequest`, `onParse`, `onTransform`, `onBeforeHandle`, `resolve`, `onAfterHandle`, `mapResponse`, `onError`, `onAfterResponse`, `trace`) | Method names treated as global hooks. |
| `routes` | `string[]` | All Elysia route methods (`get`, `post`, `put`, `patch`, `delete`, `options`, `head`, `trace`, `all`, `ws`) | Method names treated as routes. |

## Limitations

- Tracks one variable's calls per scope — doesn't follow plugin functions that return new Elysia instances.
- Cross-module ordering isn't detectable.

## Autofix

No.

## Version added

0.1.0
