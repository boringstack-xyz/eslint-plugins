import { relations } from "drizzle-orm";
import { posts } from "./posts.schema";
import { users } from "./users.schema";

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] })
}));
