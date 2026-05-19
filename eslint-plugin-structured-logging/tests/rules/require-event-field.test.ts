import {
  RULE_NAME,
  requireEventFieldRule
} from "../../src/rules/require-event-field";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireEventFieldRule, {
  valid: [
    {
      code: `logger.info({ event: "user.created", userId: "u1" });`
    },
    {
      code: `logger.error({ event: "payment.failed" }, "Payment failed");`
    },
    {
      code: `logger.debug({ ...sharedContext, userId: "u1" });`
    },
    {
      code: `someOtherObj.info({ noEvent: true });`
    },
    {
      code: `logger.info({ "event": "x" });`
    },
    {
      code: `this.logger.info({ event: "x" });`
    },
    {
      code: `logger.info({ kind: "user.created", userId: "u1" });`,
      options: [{ eventField: "kind" }]
    }
  ],
  invalid: [
    {
      code: `logger.info({ userId: "u1" });`,
      errors: [{ messageId: "missingEventField" }]
    },
    {
      code: `logger.error({ err }, "boom");`,
      errors: [{ messageId: "missingEventField" }]
    },
    {
      code: `reqLogger.warn({ count: 5 });`,
      errors: [{ messageId: "missingEventField" }]
    },
    {
      code: `logger.fatal({ message: "shutting down" });`,
      errors: [{ messageId: "missingEventField" }]
    },
    {
      code: `logger.warn("just a string message");`,
      errors: [{ messageId: "missingEventField" }]
    },
    {
      code: `logger.info({ kind: "x" });`,
      options: [{ eventField: "event" }],
      errors: [{ messageId: "missingEventField" }]
    }
  ]
});
