import {
  RULE_NAME,
  schemaFilesMustOnlyExportSchemaRule
} from "../../src/rules/schemaFilesMustOnlyExportSchema";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, schemaFilesMustOnlyExportSchemaRule, {
  valid: [
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          createdAt: timestamp("created_at").notNull(),
          updatedAt: timestamp("updated_at").notNull()
        });
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { relations } from "drizzle-orm";
        import { users } from "./users";
        export const usersRelations = relations(users, ({ one }) => ({}));
        export type User = typeof users.$inferSelect;
        export interface UserView { id: string; }
      `
    },
    {
      filename: "src/schema/index.ts",
      code: `
        export class Anything {}
        export const arrow = () => 1;
      `
    },
    {
      filename: "src/services/users.service.ts",
      code: `
        export class UsersService {}
        export const usersService = new UsersService();
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export type { User } from "./users.types";
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { pgSchema } from "drizzle-orm/pg-core";
        export const tenantSchema = pgSchema("tenant");
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { foreignKey, primaryKey, index, unique } from "drizzle-orm/pg-core";
        export const userPk = primaryKey({ columns: [] });
        export const userFk = foreignKey({ columns: [], foreignColumns: [] });
        export const userIdx = index("user_idx");
        export const userUnique = unique("user_unique");
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export { users } from "./users";
        export { posts } from "./posts";
      `
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { mySchema } from "./schema";
        import { uuid } from "drizzle-orm/pg-core";
        export const projects = mySchema.table("projects", { id: uuid("id").primaryKey() });
      `
    },
    {
      filename: "src/schema/users/custom-pattern.ts",
      code: `
        export class AnythingGoes {}
        export const arrow = () => 1;
      `,
      options: [{ filePattern: "**/*.schema.ts" }]
    }
  ],
  invalid: [
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export class UsersService {}
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "UsersService" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export const helper = () => 1;
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "helper" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export const userDefaults = { active: true };
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "userDefaults" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export default function makeUser() { return {}; }
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "makeUser" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        export function buildUser() { return {}; }
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "buildUser" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", { id: uuid("id").primaryKey() }),
          arrow = () => 1;
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "arrow" }
        }
      ]
    },
    {
      filename: "src/schema/users/users.schema.ts",
      code: `
        const internal = "value";
        export default internal;
      `,
      errors: [
        {
          messageId: "nonSchemaExport",
          data: { name: "internal" }
        }
      ]
    }
  ]
});
