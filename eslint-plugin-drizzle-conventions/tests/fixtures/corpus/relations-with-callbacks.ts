// @ts-nocheck
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", { id: uuid("id").primaryKey() });
export const posts = pgTable("posts", { id: uuid("id").primaryKey() });

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users)
}));
