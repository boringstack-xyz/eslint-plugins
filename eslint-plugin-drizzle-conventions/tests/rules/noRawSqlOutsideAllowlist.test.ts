import {
  RULE_NAME,
  noRawSqlOutsideAllowlistRule
} from "../../src/rules/noRawSqlOutsideAllowlist";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noRawSqlOutsideAllowlistRule, {
  valid: [
    {
      filename: "src/db/migrations/2026-01-init.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const up = sql\`CREATE TABLE foo (id text)\`;
      `
    },
    {
      filename: "src/raw/cleanup.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const purge = sql\`DELETE FROM tmp WHERE created_at < now()\`;
      `
    },
    {
      // Health probes — `SELECT 1` is the canonical legitimate raw SQL.
      filename: "src/api/health/checks/database.check.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const probe = async (db: { execute: (q: unknown) => Promise<unknown> }) =>
          db.execute(sql\`SELECT 1\`);
      `
    },
    {
      // Test helpers commonly issue probes too.
      filename: "tests/helpers/db.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const probe = async (db: { execute: (q: unknown) => Promise<unknown> }) =>
          db.execute(sql\`SELECT 1\`);
      `
    },
    {
      // *.check.ts file pattern (health checks, integration probes, etc.)
      filename: "src/lib/health/redis.check.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const ping = sql\`SELECT 1\`;
      `
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        import { eq } from "drizzle-orm";
        export const filterByEq = (a: unknown, b: unknown) => eq(a as never, b);
      `
    },
    {
      filename: "src/something.ts",
      code: `
        const sql = (parts: TemplateStringsArray) => parts.join("");
        export const greeting = sql\`hello\`;
      `
    },
    {
      filename: "src/svc/queries.ts",
      code: `
        export const noSqlHere = "select * from users";
      `,
      options: [{ allowFiles: ["**/migrations/**", "**/raw/**", "**/queries.ts"] }]
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        import { eq, and, or, inArray, sql } from "drizzle-orm";
        export const helpers = { eq, and, or, inArray };
      `
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        import sql from "drizzle-orm";
        export const x = sql\`SELECT 1\`;
      `
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        import { sql } from "some-other-lib";
        export const x = sql\`SELECT 1\`;
      `
    }
  ],
  invalid: [
    {
      filename: "src/users/users.service.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const banned = sql\`SELECT 1\`;
      `,
      errors: [{ messageId: "noRawSql" }]
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        import { sql as raw } from "drizzle-orm";
        export const banned = raw\`SELECT 1\`;
      `,
      errors: [{ messageId: "noRawSql" }]
    },
    {
      filename: "src/lib/queries.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const a = sql\`A\`;
        export const b = sql\`B\`;
      `,
      errors: [{ messageId: "noRawSql" }, { messageId: "noRawSql" }]
    },
    {
      filename: "src/svc/queries.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const x = sql\`X\`;
      `,
      options: [{ allowFiles: ["**/migrations/**"] }],
      errors: [{ messageId: "noRawSql" }]
    },
    {
      filename: "src/svc/queries.ts",
      code: `
        import { sql } from "drizzle-orm";
        export const x = sql\`X\`;
      `,
      options: [{ allowFiles: [] }],
      errors: [{ messageId: "noRawSql" }]
    },
    {
      filename: "src/svc/queries.ts",
      code: `
        import { sql, eq } from "drizzle-orm";
        export const a = eq(1, 2);
        export const b = sql\`SELECT *\`;
        export const c = sql\`UPDATE x\`;
      `,
      errors: [{ messageId: "noRawSql" }, { messageId: "noRawSql" }]
    }
  ]
});
