# auth-cookie-must-be-secure-in-prod

Auth-cookie writes must set `secure:` to `true` or an env-derived expression.

## Why

`secure: false` (or missing) means the session cookie travels over plain HTTP
the first time the client lands on a non-TLS endpoint — a passive sniffer
gets the session.

The rule is permissive about *how* `secure` is set: literal `true`,
`env.isProduction`, `process.env.NODE_ENV === "production"`, etc. are all
accepted. Only `secure: false` (literal) and missing `secure:` are flagged.

## Recognized call shapes

Same as `auth-cookie-must-be-httponly`. See that rule's docs.

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
cookie.session.set({ value: token, secure: env.isProduction });
cookie.session.set({
  value: token,
  secure: process.env.NODE_ENV === "production"
});
cookie.session.set({ value: token, ...AUTH_COOKIE_CONFIG });
```

Invalid:

```ts
cookie.auth_token.set({ value: token, httpOnly: true });   // missing secure
cookie.session.set({ value: token, secure: false });
cookie.auth_token.set({ ...AUTH_COOKIE_CONFIG, secure: false });
```
