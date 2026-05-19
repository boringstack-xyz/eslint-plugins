import {
  RULE_NAME,
  queueOptionsMustSetRemoveOnFailRule
} from "../../src/rules/queueOptionsMustSetRemoveOnFail";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, queueOptionsMustSetRemoveOnFailRule, {
  valid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { removeOnFail: 1000 });
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", {
          defaultJobOptions: { removeOnComplete: true, removeOnFail: 5000 }
        });
        emailQueue.add(NAME, {});
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { removeOnComplete: true, removeOnFail: false });
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { removeOnComplete: true });
      `,
      errors: [{ messageId: "missingRemoveOnFail" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {});
      `,
      errors: [{ messageId: "missingRemoveOnFail" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", { defaultJobOptions: { removeOnComplete: true } });
        emailQueue.add(NAME, {});
      `,
      errors: [{ messageId: "missingRemoveOnFail" }]
    }
  ]
});
