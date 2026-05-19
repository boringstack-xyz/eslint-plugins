# cache-key-must-be-prefixed

Cache keys must start with a configured namespace prefix.

## Why

Multiple apps share Redis instances all the time — staging, sibling
services, a monolith and its workers. Unprefixed keys collide silently:
your `user:1` overwrites theirs. A short namespace (`cache:`, `stripe:`,
`session:`) keeps writes in their own keyspace.

## How it works

For `<cache>.<method>(...)` where `<cache>` is in `cacheNames` and
`<method>` is in `methods`, the rule inspects the first argument:

- **String literal**: must `startsWith` one of the configured prefixes.
- **Template literal**: the first quasi (the leading static portion) must
  start with a prefix. So `` `cache:user:${id}` `` passes.
- **Identifier / call expression / anything else**: skipped (assumed to be
  a built key, e.g. from a helper).

## Options

```ts
{
  cacheNames?: string[];   // default: ["cacheService", "cache"]
  methods?: string[];      // default: ["set", "get", "del", "has", "wrap"]
  prefixes?: string[];     // default: ["cache:", "stripe:", "session:", "rate:", "oauth:"]
}
```

## Examples

Valid:

```ts
cacheService.get("cache:user:1");
cache.set("stripe:event:evt_123", value, { ttlSeconds: 60 });
cacheService.get(`cache:user:${id}`);
cacheService.get(builtKey);
cacheService.get(stripeEventCacheKey(eventId));
```

Invalid:

```ts
cacheService.get("user:1");
cache.del("foo");
cacheService.set(`user:${id}`, value, { ttlSeconds: 60 });
```
