import {
  RULE_NAME,
  timestampMustSpecifyModeRule
} from "../../src/rules/timestampMustSpecifyMode";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, timestampMustSpecifyModeRule, {
  valid: [
    {
      code: `
        import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at", { mode: "date" }).notNull(),
          updatedAt: timestamp("updated_at", { mode: "date" }).notNull()
        });
      `
    },
    {
      code: `
        import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
        export const sessions = pgTable("sessions", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at", { mode: "string", precision: 6 }).notNull()
        });
      `
    },
    {
      code: `
        import { columns } from "./helpers";
        export const x = columns.timestamp("col", { mode: "date" });
      `
    },
    {
      code: `
        export const fn = (parts: TemplateStringsArray) => parts.join("");
        export const greeting = fn\`hi\`;
      `
    },
    {
      code: `
        import { timestamp } from "drizzle-orm/pg-core";
        export const ts = timestamp("col", { mode: "string" });
      `,
      options: [{ allowedModes: ["string"] }]
    }
  ],
  invalid: [
    {
      code: `
        import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull()
        });
      `,
      errors: [{ messageId: "missingMode" }]
    },
    {
      code: `
        import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at", { precision: 6 }).notNull()
        });
      `,
      errors: [{ messageId: "missingMode" }]
    },
    {
      code: `
        import { timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at", { mode: "iso" }).notNull()
        });
      `,
      errors: [
        {
          messageId: "invalidMode",
          data: { allowed: "date | string", actual: "iso" }
        }
      ]
    },
    {
      code: `
        import { timestamp } from "drizzle-orm/pg-core";
        export const ts = timestamp("col", { mode: "date" });
      `,
      options: [{ allowedModes: ["string"] }],
      errors: [
        {
          messageId: "invalidMode",
          data: { allowed: "string", actual: "date" }
        }
      ]
    },
    {
      code: `
        import { timestamp } from "drizzle-orm/pg-core";
        const dynamicMode = "date";
        export const ts = timestamp("col", { mode: dynamicMode });
      `,
      errors: [
        {
          messageId: "invalidMode",
          data: { allowed: "date | string", actual: "<non-literal>" }
        }
      ]
    }
  ]
});
