import {
  RULE_NAME,
  transactionUsesTxNotDbRule
} from "../../src/rules/transaction-uses-tx-not-db";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, transactionUsesTxNotDbRule, {
  valid: [
    {
      // Uses tx — correct.
      code: `
        async function fn() {
          await db.transaction(async (tx) => {
            await tx.insert(users).values({});
            await tx.update(stats).set({ count: 1 });
          });
        }
      `
    },
    {
      // No transaction in scope — db.insert is fine.
      code: `
        async function fn() {
          await db.insert(users).values({});
        }
      `
    },
    {
      // Reads inside tx aren't writes — but if read methods are flagged,
      // they shouldn't be by default.
      code: `
        async function fn() {
          await db.transaction(async (tx) => {
            const u = await tx.select().from(users);
            await tx.update(users).set({ seen: true });
            return u;
          });
        }
      `
    }
  ],
  invalid: [
    {
      // db.insert inside transaction — flagged.
      code: `
        async function fn() {
          await db.transaction(async (tx) => {
            await db.insert(users).values({});
          });
        }
      `,
      errors: [{ messageId: "outerDbInsideTx" }]
    },
    {
      // Mixed: one tx-write + one outer-db-write.
      code: `
        async function fn() {
          await db.transaction(async (tx) => {
            await tx.insert(users).values({});
            await db.update(stats).set({ count: 1 });
          });
        }
      `,
      errors: [{ messageId: "outerDbInsideTx" }]
    },
    {
      // Multiple outer-db writes inside tx — both flagged.
      code: `
        async function fn() {
          await db.transaction(async (tx) => {
            await db.insert(users).values({});
            await db.delete(profiles);
          });
        }
      `,
      errors: [
        { messageId: "outerDbInsideTx" },
        { messageId: "outerDbInsideTx" }
      ]
    }
  ]
});
