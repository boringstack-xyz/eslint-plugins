import {
  RULE_NAME,
  tablesMustHaveTimestampsRule
} from "../../src/rules/tablesMustHaveTimestamps";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, tablesMustHaveTimestampsRule, {
  valid: [
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull()
        });
      `
    },
    {
      code: `
        import { mySchema } from "./schema";
        import { timestamp, uuid } from "drizzle-orm/pg-core";
        export const projects = mySchema.table("projects", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at"),
          updatedAt: timestamp("updated_at")
        });
      `
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const sessions = pgTable("sessions", {
          id: uuid("id").primaryKey(),
          deletedAt: timestamp("deleted_at")
        });
      `,
      options: [{ requireColumns: ["deletedAt"] }]
    },
    {
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const _migrations = pgTable("_migrations", {
          id: uuid("id").primaryKey()
        });
      `,
      options: [{ ignoreTablePattern: "^_" }]
    },
    {
      code: `
        import { someOtherFn } from "lib";
        export const notATable = someOtherFn("nope", {});
      `
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull().defaultNow(),
          updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date())
        });
      `
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          "createdAt": timestamp("created_at").notNull(),
          ["updatedAt"]: timestamp("updated_at").notNull()
        });
      `
    },
    {
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", { id: uuid("id").primaryKey() });
      `,
      options: [{ requireColumns: [] }]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull(),
          ...auditMixin
        });
      `
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
            id: uuid("id").primaryKey(),
            createdAt: timestamp("created_at").notNull(),
            updatedAt: timestamp("updated_at").notNull()
          }),
          posts = pgTable("posts", {
            id: uuid("id").primaryKey(),
            createdAt: timestamp("created_at").notNull(),
            updatedAt: timestamp("updated_at").notNull()
          });
      `
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date())
        });
      `,
      options: [{ requireOnUpdate: ["updatedAt"] }]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull().$onUpdateFn(() => new Date())
        });
      `,
      options: [{ requireOnUpdate: ["updatedAt"] }]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull()
        });
      `,
      options: [{ requireOnUpdate: ["touchedAt"] }]
    },
    {
      // New default: only createdAt is required. Token tables / append-only
      // logs / junction tables that legitimately don't update should pass.
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const passwordResetTokens = pgTable("password_reset_tokens", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull()
        });
      `
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const auditLog = pgTable("audit_log", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull()
        });
      `
    }
  ],
  invalid: [
    {
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey()
        });
      `,
      errors: [
        {
          messageId: "missingTimestamp",
          data: { name: "users", missing: "createdAt" }
        }
      ]
    },
    {
      // With both timestamps required, missing updatedAt → error
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at")
        });
      `,
      options: [{ requireColumns: ["createdAt", "updatedAt"] }],
      errors: [
        {
          messageId: "missingTimestamp",
          data: { name: "users", missing: "updatedAt" }
        }
      ]
    },
    {
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      `,
      errors: [
        {
          messageId: "missingTimestamp",
          data: { name: "users", missing: "createdAt" }
        }
      ]
    },
    {
      code: `
        import { mySchema } from "./schema";
        import { uuid } from "drizzle-orm/pg-core";
        export const projects = mySchema.table("projects", {
          id: uuid("id").primaryKey()
        });
      `,
      errors: [{ messageId: "missingTimestamp" }]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
            id: uuid("id").primaryKey(),
            createdAt: timestamp("created_at").notNull(),
            updatedAt: timestamp("updated_at").notNull()
          }),
          posts = pgTable("posts", { id: uuid("id").primaryKey() });
      `,
      errors: [
        {
          messageId: "missingTimestamp",
          data: { name: "posts", missing: "createdAt" }
        }
      ]
    },
    {
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users");
      `,
      errors: [{ messageId: "missingTimestamp" }]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull()
        });
      `,
      options: [{ requireOnUpdate: ["updatedAt"] }],
      errors: [
        {
          messageId: "missingOnUpdate",
          data: { name: "users", column: "updatedAt" }
        }
      ]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull().defaultNow()
        });
      `,
      options: [{ requireOnUpdate: ["updatedAt"] }],
      errors: [
        {
          messageId: "missingOnUpdate",
          data: { name: "users", column: "updatedAt" }
        }
      ]
    },
    {
      code: `
        import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          updatedAt: timestamp("updated_at").notNull(),
          touchedAt: timestamp("touched_at").notNull()
        });
      `,
      options: [
        {
          requireColumns: ["updatedAt", "touchedAt"],
          requireOnUpdate: ["updatedAt", "touchedAt"]
        }
      ],
      errors: [
        {
          messageId: "missingOnUpdate",
          data: { name: "users", column: "updatedAt" }
        },
        {
          messageId: "missingOnUpdate",
          data: { name: "users", column: "touchedAt" }
        }
      ]
    }
  ]
});
