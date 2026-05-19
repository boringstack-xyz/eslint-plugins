// @ts-nocheck
import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";

export const inObjectArg = pgTable("in_object_arg", {
  id: uuid("id").primaryKey(),
  parentFk: foreignKey({ columns: [], foreignColumns: [] })
});

export const inCallback = pgTable(
  "in_callback",
  { id: uuid("id").primaryKey() },
  (table) => [foreignKey({ columns: [table.id], foreignColumns: [] })]
);

export const noFk = pgTable("no_fk", {
  id: uuid("id").primaryKey()
});
