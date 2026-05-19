import { Google, generateCodeVerifier } from "arctic";

declare const google: {
  createAuthorizationURL: (
    state: string,
    verifier: string,
    scopes: string[]
  ) => URL;
};
void Google;

export async function buildAuthorizationURL(state: string): Promise<URL> {
  const verifier = await generateCodeVerifier();
  return google.createAuthorizationURL(state, verifier, ["openid", "email"]);
}
