# state-must-be-redis-backed

OAuth state must be persisted to Redis (server-side) and not stuffed into a
cookie.

## Why

A common tutorial pattern says "just sign the OAuth state cookie." It's
wrong: cookie-backed state lets attackers forge or replay state across
sessions because the verifier is the cookie itself. Server-side storage
in Redis makes the state a one-shot token that can be deleted after use.

## How it works

For files matching `stateFiles` (default `**/oauth/state.ts`,
`**/oauth/oauth.state.ts`):

- Confirms at least one call to a Redis-shaped client (`<id>.<method>(...)`
  where `<id>` ends with `redis`/`client` and `<method>` is in
  `redisMethodNames`). If absent, reports `missingRedisWrite`.
- Flags any cookie write whose argument list contains an identifier or
  string named `state` / `oauth_state` etc. — reports `stateInCookie`.

## Options

```ts
{
  stateFiles?: string[];          // default: ["**/oauth/state.ts", "**/oauth/oauth.state.ts"]
  redisMethodNames?: string[];    // default: ["set", "setex", "setEx", "SETEX", "SET"]
}
```

## Examples

In `src/oauth/state.ts`:

Valid:

```ts
import { redis } from "./redis";
export async function storeState(state: string) {
  await redis.setex("oauth:state:" + state, 600, "1");
}

import { redisClient } from "./client";
export async function storeState(state: string) {
  await redisClient.set("oauth:state:" + state, "1", "EX", 600);
}
```

Invalid:

```ts
export async function storeState(state: string) {
  cookieJar.set("state", state);              // stateInCookie
}

export async function storeState(state: string) {
  reply.setCookie("oauth_state", state);      // stateInCookie
}

export async function storeState(state: string) {
  return state.length;                        // missingRedisWrite
}
```
