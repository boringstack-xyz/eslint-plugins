import {
  RULE_NAME,
  schemaFilesMustNotImportDriverRule
} from "../../src/rules/schemaFilesMustNotImportDriver";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, schemaFilesMustNotImportDriverRule, {
  valid: [
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at", { mode: "date" }).notNull(),
          updatedAt: timestamp("updated_at", { mode: "date" }).notNull()
        });
        export const usersRelations = relations(users, ({ one }) => ({}));
      `
    },
    {
      filename: "src/services/users.service.ts",
      code: `
        import { drizzle } from "drizzle-orm/node-postgres";
        import pg from "pg";
        export const db = drizzle(new pg.Pool());
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import type { InferSelectModel } from "drizzle-orm";
        import { users } from "./users";
        export type User = InferSelectModel<typeof users>;
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { drizzle } from "some-other-package";
        export const x = drizzle();
      `
    }
  ],
  invalid: [
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { drizzle } from "drizzle-orm/node-postgres";
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", { id: uuid("id").primaryKey() });
        export const db = drizzle("");
      `,
      errors: [
        {
          messageId: "forbiddenDriverImport",
          data: { source: "drizzle-orm/node-postgres" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import pg from "pg";
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", { id: uuid("id").primaryKey() });
        export const pool = new pg.Pool();
      `,
      errors: [{ messageId: "forbiddenDriverImport", data: { source: "pg" } }]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { neon } from "@neondatabase/serverless";
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", { id: uuid("id").primaryKey() });
        export const sql = neon("");
      `,
      errors: [
        {
          messageId: "forbiddenDriverImport",
          data: { source: "@neondatabase/serverless" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { drizzle } from "drizzle-orm/aws-data-api/pg";
        export const db = drizzle({} as any);
      `,
      errors: [
        {
          messageId: "forbiddenDriverImport",
          data: { source: "drizzle-orm/aws-data-api/pg" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { drizzle } from "drizzle-orm/postgres-js";
        import postgres from "postgres";
        export const db = drizzle(postgres(""));
      `,
      errors: [
        {
          messageId: "forbiddenDriverImport",
          data: { source: "drizzle-orm/postgres-js" }
        },
        {
          messageId: "forbiddenDriverImport",
          data: { source: "postgres" }
        }
      ]
    }
  ]
});
