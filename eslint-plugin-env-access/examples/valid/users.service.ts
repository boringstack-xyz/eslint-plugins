import { env } from "@/config/env";

export function buildConnectionString(): string {
  return `${env.DATABASE_URL}?app=${env.NODE_ENV}`;
}
