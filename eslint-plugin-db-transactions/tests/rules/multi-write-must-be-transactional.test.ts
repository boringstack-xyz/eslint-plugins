import {
  RULE_NAME,
  multiWriteMustBeTransactionalRule
} from "../../src/rules/multi-write-must-be-transactional";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, multiWriteMustBeTransactionalRule, {
  valid: [
    {
      // Single write — fine.
      code: `
        async function createOne() {
          await db.insert(users).values({ id: "1" });
        }
      `
    },
    {
      // Two writes inside one transaction — pass.
      code: `
        async function createMany() {
          await db.transaction(async (tx) => {
            await tx.insert(users).values({ id: "1" });
            await tx.insert(profiles).values({ userId: "1" });
          });
        }
      `
    },
    {
      // Reads, not writes — don't count.
      code: `
        async function loadAll() {
          const a = await db.select().from(users);
          const b = await db.select().from(profiles);
          return [a, b];
        }
      `
    },
    {
      // Nested function — writes scope to that function.
      code: `
        function outer() {
          async function inner() {
            await db.insert(users).values({});
          }
          return inner;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        async function createMany() {
          await db.insert(users).values({ id: "1" });
          await db.insert(profiles).values({ userId: "1" });
        }
      `,
      errors: [{ messageId: "multiWriteOutsideTx" }]
    },
    {
      // Two writes split across two transactions in the same function —
      // still flagged. Refactoring split a transactional unit.
      code: `
        async function createMany() {
          await db.transaction(async (tx) => {
            await tx.insert(users).values({ id: "1" });
          });
          await db.transaction(async (tx) => {
            await tx.insert(profiles).values({ userId: "1" });
          });
          await db.update(stats).set({ count: 1 });
          await db.update(stats).set({ count: 2 });
        }
      `,
      errors: [{ messageId: "multiWriteOutsideTx" }]
    },
    {
      // Mixed write methods.
      code: `
        async function mix() {
          await db.insert(users).values({});
          await db.update(stats).set({ count: 1 });
          await db.delete(profiles);
        }
      `,
      errors: [{ messageId: "multiWriteOutsideTx" }]
    }
  ]
});
