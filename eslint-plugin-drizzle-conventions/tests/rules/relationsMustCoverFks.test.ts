import {
  RULE_NAME,
  relationsMustCoverFksRule
} from "../../src/rules/relationsMustCoverFks";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, relationsMustCoverFksRule, {
  valid: [
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorId: uuid("author_id").notNull(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const postsRelations = relations(posts, ({ one }) => ({}));
      `
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable(
          "posts",
          {
            id: uuid("id").primaryKey(),
            authorId: uuid("author_id").notNull()
          },
          (table) => [
            foreignKey({ columns: [table.authorId], foreignColumns: [] })
          ]
        );
        export const postsRelations = relations(posts, ({ one }) => ({}));
      `
    },
    {
      code: `
        import { pgTable, uuid } from "drizzle-orm/pg-core";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey()
        });
      `
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey()
        });
        export const posts = pgTable(
          "posts",
          { id: uuid("id").primaryKey() },
          (table) => [foreignKey({ columns: [], foreignColumns: [] })]
        );
        export const usersRelations = relations(users, ({ many }) => ({}));
        export const postsRelations = relations(posts, ({ one }) => ({}));
      `
    },
    // With `allowExternalFile: false` you're back to in-file-only mode.
    // (Under default behavior this fixture would fail because the rule
    // searches sibling relations.* files and finds none.)
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const postsRelations = relations(posts, ({ one }) => ({}));
      `,
      options: [{ allowExternalFile: false }]
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          fk1: foreignKey({ columns: [], foreignColumns: [] }),
          fk2: foreignKey({ columns: [], foreignColumns: [] }),
          fk3: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const postsRelations = relations(posts, ({ one }) => ({}));
      `
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const postsRelationsA = relations(posts, ({ one }) => ({}));
        export const postsRelationsB = relations(posts, ({ many }) => ({}));
      `
    }
  ],
  invalid: [
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
      `,
      errors: [
        {
          messageId: "missingRelations",
          data: { name: "posts" }
        }
      ]
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        export const posts = pgTable(
          "posts",
          { id: uuid("id").primaryKey() },
          (table) => [foreignKey({ columns: [], foreignColumns: [] })]
        );
      `,
      errors: [{ messageId: "missingRelations", data: { name: "posts" } }]
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey()
        });
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const usersRelations = relations(users, ({ many }) => ({}));
      `,
      errors: [{ messageId: "missingRelations", data: { name: "posts" } }]
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const users = pgTable("users", {
          id: uuid("id").primaryKey(),
          parentFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const usersRelations = relations(users, ({ many }) => ({}));
      `,
      errors: [{ messageId: "missingRelations", data: { name: "posts" } }]
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const otherRelations = relations(otherTable, ({ one }) => ({}));
      `,
      errors: [{ messageId: "missingRelations", data: { name: "posts" } }]
    },
    {
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        import { relations } from "drizzle-orm";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
        export const postsRelations = relations("posts", ({ one }) => ({}));
      `,
      errors: [{ messageId: "missingRelations", data: { name: "posts" } }]
    }
  ]
});
