// File path: src/db/migrations/2026-01-init.ts (matches **/migrations/**)
import { sql } from "drizzle-orm";

export const up = sql`CREATE TABLE foo (id text)`;
export const down = sql`DROP TABLE foo`;
