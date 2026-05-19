import {
  RULE_NAME,
  jobOptionsMustSetAttemptsRule
} from "../../src/rules/jobOptionsMustSetAttempts";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, jobOptionsMustSetAttemptsRule, {
  valid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, {
          attempts: 5,
          backoff: { type: "exponential", delay: 1000 }
        });
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", {
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: "exponential", delay: 1000 }
          }
        });
        emailQueue.add(NAME, {});
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { attempts: 1 });
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", { defaultJobOptions: { attempts: 3 } });
        emailQueue.add(NAME, {}, { backoff: { type: "fixed", delay: 500 } });
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, {});
      `,
      errors: [{ messageId: "missingAttempts" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {}, { attempts: 5 });
      `,
      errors: [{ messageId: "missingBackoff" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", { defaultJobOptions: { attempts: 5 } });
        emailQueue.add(NAME, {});
      `,
      errors: [{ messageId: "missingBackoff" }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add(NAME, {});
      `,
      options: [{ requireBackoff: false }],
      errors: [{ messageId: "missingAttempts" }]
    }
  ]
});
