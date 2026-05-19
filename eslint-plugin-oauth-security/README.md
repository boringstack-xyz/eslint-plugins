# eslint-plugin-oauth-security

[![CI](https://github.com/agjs/eslint-plugin-oauth-security/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-oauth-security/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules enforcing the security-critical OAuth invariants that lint
can catch statically:

- **`state-must-be-redis-backed`** — OAuth state must live in Redis,
  not in a signed cookie. Catches the "stuff state into a cookie"
  anti-pattern that some tutorials still recommend.
- **`pkce-required-for-oidc`** — OIDC providers (Google, Apple,
  Microsoft, Auth0, Okta, Cognito) must use PKCE.
  `<provider>.createAuthorizationURL(state, scopes)` without a
  `code_verifier` is reported.
- **`state-ttl-bounded`** — Redis state writes must use a short TTL
  (default ≤ 10 min). Long-lived state widens the replay window
  pointlessly.

> All three rules are best-effort static analysis. They catch the
> biggest classes of OAuth misconfig, but they can't replace
> integration tests that verify the full handshake against a real IdP.

## Install

```sh
pnpm add -D eslint-plugin-oauth-security
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import oauthSecurity from "eslint-plugin-oauth-security";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "oauth-security": oauthSecurity },
    rules: {
      "oauth-security/state-must-be-redis-backed": "error",
      "oauth-security/pkce-required-for-oidc": "error",
      "oauth-security/state-ttl-bounded": ["error", { maxTtlSeconds: 600 }]
    }
  }
];
```

Or use the bundled config:

```js
import oauthSecurity from "eslint-plugin-oauth-security";

export default [oauthSecurity.configs.recommended];
```

## Rules

| Rule | Description | Default in recommended |
| --- | --- | --- |
| [`state-must-be-redis-backed`](docs/rules/state-must-be-redis-backed.md) | State must persist to Redis, not cookies | `error` |
| [`pkce-required-for-oidc`](docs/rules/pkce-required-for-oidc.md) | OIDC providers must use PKCE | `error` |
| [`state-ttl-bounded`](docs/rules/state-ttl-bounded.md) | State TTL ≤ configured maximum | `error` |

## License

MIT.
