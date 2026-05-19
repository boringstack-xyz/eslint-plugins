# state-ttl-bounded

OAuth state writes to Redis must use a short TTL.

## Why

The state token's job is to bind an authorization request to a user
session for the duration of the round trip. A multi-hour or multi-day TTL
widens the replay window and serves no purpose: if the user hasn't
completed the flow in 10 minutes, they're not coming back.

## How it works

For files matching `stateFiles`, the rule inspects every Redis-shaped
write call:

- `setex(key, ttl, value)` — checks the `ttl` arg.
- `set(key, value, "EX", ttl)` — finds the `"EX"` flag, checks the
  following arg.
- `set(key, value, { EX: ttl })` (or `PX`) — checks the field value.

If the TTL is a numeric literal greater than `maxTtlSeconds`, or an
identifier whose binding is a numeric literal in the same file greater
than the max, it's reported. Identifiers that can't be statically resolved
are skipped (best-effort).

## Options

```ts
{
  stateFiles?: string[];        // default: ["**/oauth/state.ts", "**/oauth/oauth.state.ts"]
  maxTtlSeconds?: number;       // default: 600 (10 min)
}
```

## Examples

Valid:

```ts
redis.setex("oauth:state:x", 600, "1");

const TTL = 300;
redis.setex("oauth:state:x", TTL, "1");

redis.set("oauth:state:x", "1", "EX", 300);
redis.set("oauth:state:x", "1", { EX: 300 });
```

Invalid:

```ts
redis.setex("oauth:state:x", 3600, "1");

const TTL = 7200;
redis.setex("oauth:state:x", TTL, "1");

redis.set("oauth:state:x", "1", { EX: 86400 });
```
