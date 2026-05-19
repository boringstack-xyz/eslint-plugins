# cache-key-from-helper

Cache keys must be built by a configured helper function.

## Why

Once cache keys are scattered as inline strings across the codebase, every
schema migration becomes a grep-and-pray exercise. A single helper file
(`cache-keys.ts`) where `userCacheKey(id)` and `stripeEventCacheKey(eventId)`
live makes invalidation, debugging, and migrations tractable.

## Configuration

This rule is **opt-in**: with the default empty `helperNames`, it is a no-op.
Configure your project's helper functions to enable it.

## How it works

For `<cache>.<method>(...)`, the first argument must be a `CallExpression`
whose callee name is in `helperNames`. Both bare calls
(`userCacheKey(id)`) and member calls (`keys.userCacheKey(id)`) are
recognized — only the property name needs to match.

String literals and template literals as keys are forbidden once helpers
are configured.

## Options

```ts
{
  cacheNames?: string[];     // default: ["cacheService", "cache"]
  methods?: string[];        // default: ["set", "get", "del", "has", "wrap"]
  helperNames?: string[];    // default: [] — opt-in
}
```

## Examples

With `helperNames: ["stripeEventCacheKey", "userCacheKey"]`:

Valid:

```ts
cacheService.get(stripeEventCacheKey(eventId));
cacheService.set(userCacheKey(id), value, { ttlSeconds: 60 });
cacheService.get(keys.userCacheKey(id));
```

Invalid:

```ts
cacheService.get("stripe:event:evt_1");
cacheService.set(`cache:user:${id}`, value, { ttlSeconds: 60 });
cacheService.get(otherHelper(id));   // not in helperNames
```
