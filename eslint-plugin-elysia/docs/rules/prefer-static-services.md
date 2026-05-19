# prefer-static-services

Discourage `new Service()` inside Elysia route handlers when the class is stateless — prefer static methods or a singleton.

## Rationale

A class with no instance state allocates per request — every `app.get("/x", () => new Service().method())` creates and discards an object on the hot path. For services that genuinely have no per-request data, this is wasteful. Either expose static methods, or instantiate once at module scope.

## ❌ Incorrect

```ts
class UserService {
  list() { return []; }
}

new Elysia().get("/users", () => {
  const service = new UserService();
  return service.list();
});
```

## ✅ Correct

```ts
abstract class UserService {
  static list() { return []; }
}

new Elysia().get("/users", () => UserService.list());
```

Or — when constructor injection IS needed and provides per-request data — use it explicitly:

```ts
class UserService {
  constructor(private db: Db) {}
  list() { return this.db.users; }
}

new Elysia().get("/users", ({ db }) => new UserService(db).list());
```

The rule does NOT flag this form because the constructor takes a per-request argument.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `classNamePattern` | `string` (regex) | `"(Service\|Controller\|Manager\|Repository)$"` | Class names matching this pattern are considered service-like. |

## Stateless heuristic

A class is "stateless" iff:

- No non-static instance fields (`PropertyDefinition`).
- No constructor body (or empty body).
- No `TSParameterProperty` constructor params (those create implicit fields).
- No method body assigns to `this.<x>`.

## Limitations

- Single-file analysis only. Imported classes can't be inspected.
- Method-internal closures over hidden state aren't detectable.

## Autofix

No.

## Version added

0.1.0
