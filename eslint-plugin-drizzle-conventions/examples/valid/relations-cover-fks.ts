import { pgTable, uuid, foreignKey, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey(),
    authorId: uuid("author_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull()
  },
  (table) => [
    foreignKey({ columns: [table.authorId], foreignColumns: [users.id] })
  ]
);

export const usersRelations = relations(users, ({ many }) => ({}));
export const postsRelations = relations(posts, ({ one }) => ({}));
