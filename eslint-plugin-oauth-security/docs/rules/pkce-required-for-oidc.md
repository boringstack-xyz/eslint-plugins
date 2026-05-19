# pkce-required-for-oidc

OIDC providers (Google, Apple, Microsoft, Auth0, Okta, Cognito, ...) must
use PKCE.

## Why

OIDC mandates PKCE for public clients. Without a `code_verifier`, an
attacker who intercepts the authorization code can redeem it. Static
detection here is best-effort but catches the most common omission:
calling `<provider>.createAuthorizationURL(state, scopes)` with no
verifier.

## How it works

For files matching `providersGlob` (default `**/oauth/providers/**`):

- Detects an OIDC provider class import (`Google`, `Apple`, ...).
- Inspects each `buildAuthorizationURL` / `getAuthorizationURL` function:
  if it calls `<client>.createAuthorizationURL(...)`, the second
  positional argument must be a `codeVerifier` identifier (tracked from
  a `generateCodeVerifier()` call), OR the call must have ≥3 positional
  arguments (taken as the OIDC variant).

If a non-OIDC provider class (e.g. `GitHub`) is imported, the rule does
not fire.

## Options

```ts
{
  providersGlob?: string;       // default: "**/oauth/providers/**"
  oidcProviders?: string[];     // default: ["Google", "Apple", "Microsoft", "MicrosoftEntraId", "Auth0", "Okta", "Cognito"]
  verifierFnNames?: string[];   // default: ["generateCodeVerifier"]
}
```

## Examples

In `src/oauth/providers/google.ts`:

Valid:

```ts
import { Google, generateCodeVerifier } from "arctic";
export async function buildAuthorizationURL(state: string) {
  const verifier = await generateCodeVerifier();
  return google.createAuthorizationURL(state, verifier, ["openid", "email"]);
}
```

In `src/oauth/providers/github.ts` (not OIDC):

```ts
import { GitHub } from "arctic";
export function buildAuthorizationURL(state: string) {
  return github.createAuthorizationURL(state, ["user:email"]);
}
```

Invalid:

```ts
import { Google } from "arctic";
export function buildAuthorizationURL(state: string) {
  return google.createAuthorizationURL(state, ["openid"]);   // no verifier
}
```
