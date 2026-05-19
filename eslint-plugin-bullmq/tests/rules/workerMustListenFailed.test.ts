import {
  RULE_NAME,
  workerMustListenFailedRule
} from "../../src/rules/workerMustListenFailed";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, workerMustListenFailedRule, {
  valid: [
    {
      code: `
        import { Worker } from "bullmq";
        const worker = new Worker("queue", async () => {});
        worker.on("failed", (job, err) => console.error(err));
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker = new Worker("queue", async () => {});
          constructor() {
            this.worker.on("failed", (job, err) => console.error(err));
          }
          async close() { await this.worker.close(); }
        }
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        const w1 = new Worker("a", async () => {});
        const w2 = new Worker("b", async () => {});
        w1.on("failed", () => {});
        w2.on("failed", () => {});
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        const worker = new Worker("queue", async () => {});
        worker.on("failed", () => {});
        worker.on("stalled", () => {});
      `,
      options: [{ requiredEvents: ["failed", "stalled"] }]
    },
    {
      code: `
        export class NotBullmq {
          run() { return null; }
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Worker } from "bullmq";
        const worker = new Worker("queue", async () => {});
        worker.on("completed", () => {});
      `,
      errors: [{ messageId: "missingListener", data: { name: "worker", event: "failed" } }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker = new Worker("queue", async () => {});
          async close() { await this.worker.close(); }
        }
      `,
      errors: [{ messageId: "missingListener", data: { name: "this.worker", event: "failed" } }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        const w1 = new Worker("a", async () => {});
        const w2 = new Worker("b", async () => {});
        w1.on("failed", () => {});
      `,
      errors: [{ messageId: "missingListener", data: { name: "w2", event: "failed" } }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        const worker = new Worker("queue", async () => {});
        worker.on("failed", () => {});
      `,
      options: [{ requiredEvents: ["failed", "stalled"] }],
      errors: [{ messageId: "missingListener", data: { name: "worker", event: "stalled" } }]
    }
  ]
});
