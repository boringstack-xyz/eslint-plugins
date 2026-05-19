# no-decorate-state-collision

Disallow duplicate keys across `.decorate()` / `.state()` / `.derive()` / `.resolve()` calls on a single Elysia instance — duplicates silently overwrite and break plugin composition.

## Rationale

`decorate`, `state`, `derive`, and `resolve` all add properties to the same shared context shape. Registering the same key twice makes the second registration silently overwrite the first — without an error, without a warning, without anything in the type system noticing if the values are the same shape. Plugins composed from this become non-deterministic depending on registration order.

## ❌ Incorrect

```ts
export const dbPlugin = new Elysia({ name: "db" })
  .decorate("db", a)
  .decorate("db", b); // ← second decorate("db", ...) silently wins
```

```ts
export const auth = new Elysia({ name: "auth" })
  .decorate("session", null)
  .resolve(() => ({ session: getSession() })); // ← collides with decorate
```

```ts
const app = new Elysia();
app.decorate("x", 1);
app.state("x", 2); // ← cross-method collision on same var
```

## ✅ Correct

```ts
export const dbPlugin = new Elysia({ name: "db" })
  .decorate("db", buildDb())
  .state("requestId", "");
```

## Detection scope

The rule covers four kinds of registration:

- `.decorate(key, value)` — single string-literal key.
- `.decorate({ keyA, keyB })` — multi-key object form.
- `.state(...)` / `.derive(...)` / `.resolve(...)` — same shapes.
- `derive`/`resolve` callbacks — keys come from the callback's returned object literal:
  ```ts
  .resolve(() => ({ session: "x" })) // registers "session"
  ```

Collisions are detected:

- Within a single chain: `.decorate(...).state(...)` on the same `new Elysia(...)`.
- Across separate top-level calls on the same exported variable: `app.decorate(...); app.state(...);`.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `methods` | `string[]` | `["decorate", "state", "derive", "resolve"]` | Method names tracked. Override only if you've wrapped Elysia behind a custom client. |

## Limitations

- Cross-file collision detection is out of scope (would require parser services + cross-module name resolution).
- Computed object keys (`[runtimeKey]`) and spread elements (`...mixin`) are skipped — too dynamic to verify statically.
- Callbacks that return non-object-literal expressions (e.g., a variable reference) are skipped.

## Autofix

No.

## Version added

0.1.0
