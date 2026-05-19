import {
  RULE_NAME,
  authCookieMustBeHttpOnlyRule
} from "../../src/rules/auth-cookie-must-be-httponly";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, authCookieMustBeHttpOnlyRule, {
  valid: [
    {
      code: `cookie.auth_token.set({ value: token, httpOnly: true, secure: true });`
    },
    {
      // Trusted helper spread.
      code: `cookie.session.set({ value: token, ...AUTH_COOKIE_CONFIG });`
    },
    {
      // httpOnly is an env-derived expression — non-literal accepted.
      code: `cookie.session.set({ value: token, httpOnly: env.httpOnly });`
    },
    {
      // Generic helper form.
      code: `setCookie("auth_token", token, { httpOnly: true });`
    },
    {
      // Fastify form.
      code: `reply.setCookie("session", token, { httpOnly: true, secure: true });`
    },
    {
      // Unrelated cookie name — rule no-ops.
      code: `cookie.csrf.set({ value: token });`
    },
    {
      // Unrelated callee — name not in setCookieFunctions.
      code: `myObj.send("auth_token", { httpOnly: false });`
    }
  ],
  invalid: [
    {
      code: `cookie.auth_token.set({ value: token });`,
      errors: [{ messageId: "missingHttpOnly" }]
    },
    {
      code: `cookie.session.set({ value: token, httpOnly: false });`,
      errors: [{ messageId: "missingHttpOnly" }]
    },
    {
      code: `setCookie("auth_token", token, { secure: true });`,
      errors: [{ messageId: "missingHttpOnly" }]
    },
    {
      code: `reply.setCookie("session", token, { httpOnly: false });`,
      errors: [{ messageId: "missingHttpOnly" }]
    },
    {
      // Trusted spread but explicit httpOnly: false overrides — still flag.
      code: `cookie.auth_token.set({ ...AUTH_COOKIE_CONFIG, httpOnly: false });`,
      errors: [{ messageId: "missingHttpOnly" }]
    }
  ]
});
