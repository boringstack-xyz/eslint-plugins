import {
  RULE_NAME,
  queueOptionsMustSetRemoveOnCompleteRule
} from "../../src/rules/queueOptionsMustSetRemoveOnComplete";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, queueOptionsMustSetRemoveOnCompleteRule, {
  valid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { removeOnComplete: true });
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { removeOnComplete: 1000 });
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", {
          defaultJobOptions: { removeOnComplete: true }
        });
        emailQueue.add(NAME, {});
      `
    },
    {
      code: `
        // not a queue, ignored
        const list = [];
        list.add(1);
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {});
      `,
      errors: [{ messageId: "missingRemoveOnComplete" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, {});
      `,
      errors: [{ messageId: "missingRemoveOnComplete" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", { defaultJobOptions: { removeOnFail: 100 } });
        emailQueue.add(NAME, {});
      `,
      errors: [{ messageId: "missingRemoveOnComplete" }]
    }
  ]
});
