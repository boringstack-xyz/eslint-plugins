import {
  RULE_NAME,
  jobNameMustBeConstantRule
} from "../../src/rules/jobNameMustBeConstant";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, jobNameMustBeConstantRule, {
  valid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email", { defaultJobOptions: {} });
        const SEND_EMAIL = "send-email" as const;
        emailQueue.add(SEND_EMAIL, { to: "x" });
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const JobNames = { SendEmail: "send-email" } as const;
        const emailQueue = new Queue("email");
        emailQueue.add(JobNames.SendEmail, {});
      `
    },
    {
      code: `
        // unrelated .add()
        const list = [1];
        list.add(2);
      `
    },
    {
      code: `
        import { Queue } from "bullmq";
        const myQueue = new Queue("m");
        const name: string = computeName();
        myQueue.add(name, {});
        declare function computeName(): string;
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Queue } from "bullmq";
        const emailQueue = new Queue("email");
        emailQueue.add("send-email", { to: "x" });
      `,
      errors: [{ messageId: "literalJobName", data: { value: "send-email" } }]
    },
    {
      code: `
        import { Queue } from "bullmq";
        const myQueue = new Queue("m");
        myQueue.add(\`literal-template\`, {});
      `,
      errors: [{ messageId: "literalJobName" }]
    },
    {
      code: `
        // queue identified by name suffix only
        anyQueue.add("something", {});
      `,
      errors: [{ messageId: "literalJobName", data: { value: "something" } }]
    }
  ]
});
