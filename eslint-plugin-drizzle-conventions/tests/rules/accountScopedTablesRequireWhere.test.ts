import {
  RULE_NAME,
  accountScopedTablesRequireWhereRule
} from "../../src/rules/accountScopedTablesRequireWhere";
import { ruleTester } from "../test-utils/ruleTester";

const options: [{ tables: string[]; scopeColumn: string }] = [
  { tables: ["widgets", "memberships"], scopeColumn: "accountId" }
];

ruleTester.run(RULE_NAME, accountScopedTablesRequireWhereRule, {
  valid: [
    {
      name: "select() chained with where(eq(widgets.accountId, ...)) is fine",
      code: `
        const rows = await db.select().from(widgets).where(eq(widgets.accountId, accountId));
      `,
      options
    },
    {
      name: "select chained with and(...) including accountId is fine",
      code: `
        const rows = await db.select().from(widgets).where(and(eq(widgets.accountId, accountId), gt(widgets.createdAt, since)));
      `,
      options
    },
    {
      name: "insert with values containing accountId is fine",
      code: `
        await db.insert(widgets).values({ name: "x", accountId });
      `,
      options
    },
    {
      name: "update with set and where(accountId) is fine",
      code: `
        await db.update(widgets).set({ name: "y" }).where(and(eq(widgets.id, id), eq(widgets.accountId, accountId)));
      `,
      options
    },
    {
      name: "delete with where(accountId) is fine",
      code: `
        await db.delete(widgets).where(eq(widgets.accountId, accountId));
      `,
      options
    },
    {
      name: "queries against non-scoped tables are not checked",
      code: `
        const all = await db.select().from(public_announcements);
      `,
      options
    },
    {
      name: "db.query.widgets.findFirst with where referencing accountId is fine",
      code: `
        const row = await db.query.widgets.findFirst({ where: eq(widgets.accountId, accountId) });
      `,
      options
    },
    {
      name: "values with spread (potential accountId at runtime) is treated as a soft pass",
      code: `
        await db.insert(widgets).values({ ...input });
      `,
      options
    }
  ],
  invalid: [
    {
      name: "select() without any where clause is flagged",
      code: `
        const rows = await db.select().from(widgets);
      `,
      options,
      errors: [{ messageId: "missingScopeFilter" }]
    },
    {
      name: "select() with where that does NOT reference accountId is flagged",
      code: `
        const rows = await db.select().from(widgets).where(eq(widgets.id, id));
      `,
      options,
      errors: [{ messageId: "missingScopeFilter" }]
    },
    {
      name: "insert() with values missing accountId is flagged",
      code: `
        await db.insert(widgets).values({ name: "x" });
      `,
      options,
      errors: [{ messageId: "missingScopeFilter" }]
    },
    {
      name: "delete() without a where clause is flagged (mass-delete risk)",
      code: `
        await db.delete(widgets);
      `,
      options,
      errors: [{ messageId: "missingScopeFilter" }]
    },
    {
      name: "update() with where missing accountId is flagged",
      code: `
        await db.update(widgets).set({ name: "y" }).where(eq(widgets.id, id));
      `,
      options,
      errors: [{ messageId: "missingScopeFilter" }]
    },
    {
      name: "db.query.widgets.findFirst with where missing accountId is flagged",
      code: `
        const row = await db.query.widgets.findFirst({ where: eq(widgets.id, id) });
      `,
      options,
      errors: [{ messageId: "missingScopeFilter" }]
    }
  ]
});

ruleTester.run(`${RULE_NAME} (allowFiles + alternateScopeColumns)`, accountScopedTablesRequireWhereRule, {
  valid: [
    {
      name: "allowFiles glob suppresses the rule entirely",
      code: `
        const all = await db.select().from(widgets);
      `,
      filename: "src/queues/sweep/maintenance.jobs.ts",
      options: [
        {
          tables: ["widgets"],
          scopeColumn: "accountId",
          allowFiles: ["**/queues/**/*.jobs.ts"]
        }
      ] as [{ tables: string[]; scopeColumn: string; allowFiles: string[] }]
    },
    {
      name: "alternateScopeColumns lets a unique-token filter pass",
      code: `
        const inv = await db
          .select()
          .from(accountInvitations)
          .where(eq(accountInvitations.tokenHash, hash));
      `,
      options: [
        {
          tables: ["accountInvitations"],
          scopeColumn: "accountId",
          alternateScopeColumns: ["tokenHash"]
        }
      ] as [
        {
          tables: string[];
          scopeColumn: string;
          alternateScopeColumns: string[];
        }
      ]
    },
    {
      name: "alternateScopeColumns also covers findFirst object args",
      code: `
        const inv = await db.query.accountInvitations.findFirst({ where: eq(accountInvitations.tokenHash, hash) });
      `,
      options: [
        {
          tables: ["accountInvitations"],
          scopeColumn: "accountId",
          alternateScopeColumns: ["tokenHash"]
        }
      ] as [
        {
          tables: string[];
          scopeColumn: string;
          alternateScopeColumns: string[];
        }
      ]
    }
  ],
  invalid: [
    {
      name: "allowFiles glob is path-scoped — a non-matching path is still checked",
      code: `
        const all = await db.select().from(widgets);
      `,
      filename: "src/api/widgets/widgets.service.ts",
      options: [
        {
          tables: ["widgets"],
          scopeColumn: "accountId",
          allowFiles: ["**/queues/**/*.jobs.ts"]
        }
      ] as [{ tables: string[]; scopeColumn: string; allowFiles: string[] }],
      errors: [{ messageId: "missingScopeFilter" }]
    }
  ]
});
