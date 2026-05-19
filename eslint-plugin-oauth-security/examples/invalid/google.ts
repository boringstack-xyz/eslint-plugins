import { Google } from "arctic";

declare const google: {
  createAuthorizationURL: (state: string, scopes: string[]) => URL;
};
void Google;

// pkce-required-for-oidc: Google is OIDC but no PKCE verifier is passed
export function buildAuthorizationURL(state: string): URL {
  return google.createAuthorizationURL(state, ["openid"]);
}
