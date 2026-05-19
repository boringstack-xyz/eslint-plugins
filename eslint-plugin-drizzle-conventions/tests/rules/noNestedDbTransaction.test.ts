import {
  RULE_NAME,
  noNestedDbTransactionRule
} from "../../src/rules/noNestedDbTransaction";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noNestedDbTransactionRule, {
  valid: [
    {
      code: `
        async function createUser(db: any) {
          await db.transaction(async (tx: any) => {
            await tx.insert(users).values({});
          });
        }
      `
    },
    {
      code: `
        async function createUserAndProfile(db: any) {
          await db.transaction(async (tx: any) => {
            await tx.insert(users).values({});
            await tx.transaction(async (tx2: any) => {
              await tx2.insert(profiles).values({});
            });
          });
        }
      `
    },
    {
      code: `
        async function topLevel(db: any) {
          await db.transaction(async (tx) => {
            await tx.insert(users).values({});
          });
          await db.transaction(async (tx) => {
            await tx.insert(posts).values({});
          });
        }
      `
    },
    {
      code: `
        async function noTransactionAtAll(db: any) {
          await db.insert(users).values({});
        }
      `
    },
    {
      code: `
        async function busFn(bus: { transaction: (cb: any) => void }) {
          bus.transaction(() => {
            bus.transaction(() => {});
          });
        }
      `,
      options: [{ transactionMethod: "atomic" }]
    }
  ],
  invalid: [
    {
      code: `
        async function badNested(db: any) {
          await db.transaction(async (tx: any) => {
            await db.transaction(async (tx2: any) => {
              await tx2.insert(profiles).values({});
            });
          });
        }
      `,
      errors: [
        {
          messageId: "nestedTransaction",
          data: { receiver: "db", method: "transaction" }
        }
      ]
    },
    {
      code: `
        async function badThroughHelper(db: any) {
          await db.transaction(async (tx: any) => {
            await tx.insert(users).values({});
            await db.transaction(async (innerTx: any) => {});
            await tx.update(users).set({});
          });
        }
      `,
      errors: [
        {
          messageId: "nestedTransaction",
          data: { receiver: "db", method: "transaction" }
        }
      ]
    },
    {
      code: `
        async function badAlias(database: any) {
          await database.transaction(async (tx: any) => {
            await database.transaction(async () => {});
          });
        }
      `,
      errors: [
        {
          messageId: "nestedTransaction",
          data: { receiver: "database", method: "transaction" }
        }
      ]
    },
    {
      code: `
        async function tripleNested(db: any) {
          await db.transaction(async (tx: any) => {
            await tx.transaction(async (tx2: any) => {
              await db.transaction(async () => {});
            });
          });
        }
      `,
      errors: [
        {
          messageId: "nestedTransaction",
          data: { receiver: "db", method: "transaction" }
        }
      ]
    },
    {
      code: `
        async function badAtomic(database: any) {
          await database.atomic(async (tx: any) => {
            await database.atomic(async () => {});
          });
        }
      `,
      options: [{ transactionMethod: "atomic" }],
      errors: [
        {
          messageId: "nestedTransaction",
          data: { receiver: "database", method: "atomic" }
        }
      ]
    }
  ]
});
