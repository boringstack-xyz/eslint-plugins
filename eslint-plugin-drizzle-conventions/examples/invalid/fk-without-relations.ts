import { pgTable, uuid, foreignKey, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey(),
  authorFk: foreignKey({ columns: [], foreignColumns: [] }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});
