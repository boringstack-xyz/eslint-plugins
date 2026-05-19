import tsParser from "@typescript-eslint/parser";
import oauthSecurity from "eslint-plugin-oauth-security";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "oauth-security": oauthSecurity
    },
    rules: {
      "oauth-security/state-must-be-redis-backed": "error",
      "oauth-security/pkce-required-for-oidc": "error",
      "oauth-security/state-ttl-bounded": ["error", { maxTtlSeconds: 600 }]
    }
  }
];
