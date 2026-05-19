import {
  RULE_NAME,
  noBlockingConcurrencyZeroRule
} from "../../src/rules/noBlockingConcurrencyZero";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noBlockingConcurrencyZeroRule, {
  valid: [
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {}, { concurrency: 5 });
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {}, { concurrency });
        declare const concurrency: number;
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {}, { concurrency: Number(process.env.CONCURRENCY) });
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {});
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {}, { concurrency: 0 });
      `,
      errors: [{ messageId: "invalidConcurrency", data: { value: "0" } }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {}, { concurrency: -1 });
      `,
      errors: [{ messageId: "invalidConcurrency", data: { value: "-1" } }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        new Worker("queue", async () => {}, { concurrency: -10 });
      `,
      errors: [{ messageId: "invalidConcurrency", data: { value: "-10" } }]
    }
  ]
});
