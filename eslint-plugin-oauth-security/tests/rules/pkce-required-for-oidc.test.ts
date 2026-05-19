import {
  RULE_NAME,
  pkceRequiredForOidcRule
} from "../../src/rules/pkce-required-for-oidc";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, pkceRequiredForOidcRule, {
  valid: [
    {
      // Not under providersGlob.
      filename: "src/users/users.service.ts",
      code: `import { Google } from "arctic"; const x = 1;`
    },
    {
      // GitHub is not OIDC — no PKCE needed.
      filename: "src/oauth/providers/github.ts",
      code: `
        import { GitHub } from "arctic";
        export function buildAuthorizationURL(state: string) {
          return github.createAuthorizationURL(state, ["user:email"]);
        }
      `
    },
    {
      // Google OIDC with PKCE.
      filename: "src/oauth/providers/google.ts",
      code: `
        import { Google, generateCodeVerifier } from "arctic";
        export async function buildAuthorizationURL(state: string) {
          const verifier = await generateCodeVerifier();
          return google.createAuthorizationURL(state, verifier, ["openid", "email"]);
        }
      `
    },
    {
      // Three positional args without identifier-traceable verifier — accepted
      // as the OIDC variant (conservative).
      filename: "src/oauth/providers/auth0.ts",
      code: `
        import { Auth0 } from "arctic";
        export function buildAuthorizationURL(state: string, v: string, scopes: string[]) {
          return auth0.createAuthorizationURL(state, v, scopes);
        }
      `
    }
  ],
  invalid: [
    {
      filename: "src/oauth/providers/google.ts",
      code: `
        import { Google } from "arctic";
        export function buildAuthorizationURL(state: string) {
          return google.createAuthorizationURL(state, ["openid"]);
        }
      `,
      errors: [{ messageId: "missingPkce" }]
    },
    {
      filename: "src/oauth/providers/microsoft.ts",
      code: `
        import { Microsoft } from "arctic";
        export function getAuthorizationURL(state: string) {
          return ms.createAuthorizationURL(state, ["openid"]);
        }
      `,
      errors: [{ messageId: "missingPkce" }]
    },
    {
      filename: "src/oauth/providers/okta.ts",
      code: `
        import { Okta } from "arctic";
        export function buildAuthorizationURL(state: string) {
          return okta.createAuthorizationURL(state);
        }
      `,
      errors: [{ messageId: "missingPkce" }]
    }
  ]
});
