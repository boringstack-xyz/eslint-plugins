// @ts-nocheck
import { sql as raw } from "drizzle-orm";

export const allowedInMigrationsOnly = raw`SELECT 1`;
