# cache-set-must-have-ttl

Require an explicit TTL field on cache `.set` calls.

## Why

`cacheService.set(key, value)` with no TTL on Redis is a slow-burning OOM:
entries accumulate forever and nothing evicts them. Force every write to
declare its lifetime up front.

The rule treats a spread (`{ ...defaultOpts }`) as permissive — if your team
has a default-options helper, that's accepted on trust.

## Options

```ts
{
  cacheNames?: string[];   // default: ["cacheService", "cache"]
  methods?: string[];      // default: ["set"]
  ttlField?: string;       // default: "ttlSeconds"
}
```

## Examples

Valid:

```ts
cacheService.set("cache:user:1", value, { ttlSeconds: 60 });
cacheService.set("cache:x", value, { ...defaultOpts });
this.cacheService.set("cache:x", value, { ttlSeconds: 300 });
```

Invalid:

```ts
cacheService.set("cache:user:1", value);
cacheService.set("cache:x", value, {});
cacheService.set("cache:x", value, { foo: "bar" });
```
