# require-plugin-name

Exported Elysia plugin instances must declare `new Elysia({ name: "..." })` so the runtime can deduplicate plugin re-imports.

## Rationale

Without a `name`, Elysia treats each `.use(plugin)` call as a fresh registration. If two route files both `.use(authPlugin)`, the plugin's setup logic (database connections, decorations, hooks) runs twice — leaking memory, duplicating subscriptions, exhausting connection pools.

Naming the plugin lets Elysia recognize it as the same instance across imports and run setup once.

## ❌ Incorrect

```ts
export default new Elysia();
export const authPlugin = new Elysia();
export const db = new Elysia().decorate("db", buildDb());
```

## ✅ Correct

```ts
export default new Elysia({ name: "Auth.Plugin" });
export const authPlugin = new Elysia({ name: "Auth.Plugin" });
export const db = new Elysia({ name: "Db.Plugin" }).decorate("db", buildDb());
```

The rule only fires on **exported** Elysia instances. Local apps (`const app = new Elysia(); app.listen(3000)`) are untouched.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowAnonymousDefault` | `boolean` | `false` | When `true`, skip `export default new Elysia()` (use sparingly — the deduplication issue still applies). |

## Autofix

No.

## Version added

0.1.0
