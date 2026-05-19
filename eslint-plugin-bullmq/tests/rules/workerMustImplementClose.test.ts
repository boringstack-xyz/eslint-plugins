import {
  RULE_NAME,
  workerMustImplementCloseRule
} from "../../src/rules/workerMustImplementClose";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, workerMustImplementCloseRule, {
  valid: [
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker = new Worker("queue", async () => {});
          async close() { await this.worker.close(); }
        }
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker: Worker;
          constructor() {
            this.worker = new Worker("queue", async () => {});
          }
          async shutdown() { await this.worker.close(); }
        }
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class NestProvider {
          private worker = new Worker("q", async () => {});
          async onModuleDestroy() { await this.worker.close(); }
        }
      `
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class NotAWorkerOwner {
          run() {
            const w = new Worker("q", async () => {});
            return w;
          }
        }
      `
    },
    {
      code: `
        export class NoBullmqHere {
          private worker = new (class {})();
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker = new Worker("queue", async () => {});
        }
      `,
      errors: [{ messageId: "missingClose" }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker: Worker;
          constructor() { this.worker = new Worker("q", async () => {}); }
        }
      `,
      errors: [{ messageId: "missingClose" }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private a = new Worker("a", async () => {});
          private b = new Worker("b", async () => {});
        }
      `,
      errors: [{ messageId: "missingClose" }]
    },
    {
      code: `
        import { Worker } from "bullmq";
        export class JobService {
          private worker = new Worker("q", async () => {});
          async destroy() { await this.worker.close(); }
        }
      `,
      options: [{ closeMethodNames: ["close", "shutdown"] }],
      errors: [{ messageId: "missingClose" }]
    }
  ]
});
