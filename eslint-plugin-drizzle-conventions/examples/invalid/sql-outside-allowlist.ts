// File path: src/services/users.service.ts (NOT in allowlist)
import { sql } from "drizzle-orm";

export const ban = sql`UPDATE users SET banned = true`;
