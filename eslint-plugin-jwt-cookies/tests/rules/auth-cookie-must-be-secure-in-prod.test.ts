import {
  RULE_NAME,
  authCookieMustBeSecureInProdRule
} from "../../src/rules/auth-cookie-must-be-secure-in-prod";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, authCookieMustBeSecureInProdRule, {
  valid: [
    {
      code: `cookie.auth_token.set({ value: token, httpOnly: true, secure: true });`
    },
    {
      // Env-derived expression.
      code: `cookie.session.set({ value: token, secure: env.isProduction });`
    },
    {
      // Conditional, non-literal.
      code: `cookie.session.set({ value: token, secure: process.env.NODE_ENV === "production" });`
    },
    {
      // Trusted helper spread.
      code: `cookie.session.set({ value: token, ...AUTH_COOKIE_CONFIG });`
    },
    {
      code: `setCookie("auth_token", token, { secure: true, httpOnly: true });`
    }
  ],
  invalid: [
    {
      code: `cookie.auth_token.set({ value: token, httpOnly: true });`,
      errors: [{ messageId: "missingSecure" }]
    },
    {
      code: `cookie.session.set({ value: token, secure: false, httpOnly: true });`,
      errors: [{ messageId: "missingSecure" }]
    },
    {
      code: `setCookie("auth_token", token, { httpOnly: true });`,
      errors: [{ messageId: "missingSecure" }]
    },
    {
      // Trusted spread but explicit secure: false overrides.
      code: `cookie.auth_token.set({ ...AUTH_COOKIE_CONFIG, secure: false });`,
      errors: [{ messageId: "missingSecure" }]
    }
  ]
});
