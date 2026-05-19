// File path: src/schema/users/users.schema.ts
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const usersRelations = relations(users, ({ one }) => ({}));

export type User = typeof users.$inferSelect;
export interface UserView {
  readonly id: string;
}
