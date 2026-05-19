# auth-cookie-must-be-httponly

Auth-cookie writes must set `httpOnly: true`.

## Why

Without `httpOnly`, the session cookie is readable from JavaScript. Any XSS
turns into instant session theft. The flag costs nothing — the only reason
to omit it is forgetting.

## Recognized call shapes

- `cookie.<name>.set({ ... })` (Elysia / Hono)
- `setCookie("<name>", value, { ... })` (generic)
- `reply.setCookie("<name>", value, { ... })` (Fastify)

The `<name>` (or first string argument) must be in `authCookieNames` for the
rule to apply. The options object must either contain `httpOnly: true` (or a
non-literal expression — accepted on trust) or spread an identifier in
`trustedConfigNames` (the cookie-config helper pattern).

If a trusted spread is present *and* an explicit `httpOnly: false` overrides
it, the explicit override is reported.

## Options

```ts
{
  authCookieNames?: string[];     // default: ["auth_token", "session", "sid", "authToken"]
  trustedConfigNames?: string[];  // default: ["AUTH_COOKIE_CONFIG"]
  setCookieFunctions?: string[];  // default: ["setCookie", "set"]
}
```

## Examples

Valid:

```ts
cookie.auth_token.set({ value: token, httpOnly: true, secure: true });
cookie.session.set({ value: token, ...AUTH_COOKIE_CONFIG });
setCookie("auth_token", token, { httpOnly: true });
reply.setCookie("session", token, { httpOnly: true, secure: true });
```

Invalid:

```ts
cookie.auth_token.set({ value: token });
cookie.session.set({ value: token, httpOnly: false });
setCookie("auth_token", token, { secure: true });
cookie.auth_token.set({ ...AUTH_COOKIE_CONFIG, httpOnly: false });
```
