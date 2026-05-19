import {
  RULE_NAME,
  maskPiiFieldsRule
} from "../../src/rules/mask-pii-fields";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, maskPiiFieldsRule, {
  valid: [
    {
      code: `logger.info({ event: "x", email: maskEmailForLogging(user.email) });`
    },
    {
      code: `logger.info({ event: "x", token: maskToken(t) });`
    },
    {
      code: `logger.info({ event: "x", password: "[REDACTED]" });`
    },
    {
      code: `logger.info({ event: "x", apiKey: "***" });`
    },
    {
      code: `logger.info({ event: "x", userId: user.id });`
    },
    {
      code: `someObj.info({ email: user.email });`
    },
    {
      code: `logger.info({ event: "x", phone: redactor.redact(p) });`
    },
    {
      code: `logger.info({ event: "x", email: scrub(e) });`,
      options: [{ maskFunctions: ["scrub"] }]
    }
  ],
  invalid: [
    {
      code: `logger.info({ event: "x", email: user.email });`,
      errors: [{ messageId: "unmaskedPii" }]
    },
    {
      code: `logger.error({ event: "x", token: t }, "boom");`,
      errors: [{ messageId: "unmaskedPii" }]
    },
    {
      code: `logger.warn({ event: "x", password: pwd });`,
      errors: [{ messageId: "unmaskedPii" }]
    },
    {
      code: `logger.info({ event: "x", phone: u.phone, ssn: u.ssn });`,
      errors: [
        { messageId: "unmaskedPii" },
        { messageId: "unmaskedPii" }
      ]
    },
    {
      code: `logger.info({ event: "x", apiKey: process.env.STRIPE_KEY });`,
      errors: [{ messageId: "unmaskedPii" }]
    }
  ]
});
