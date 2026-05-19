export const recommendedRules = {
  "drizzle-conventions/tables-must-have-timestamps": "error",
  "drizzle-conventions/timestamp-must-specify-mode": "error",
  "drizzle-conventions/relations-must-cover-fks": "error",
  "drizzle-conventions/no-raw-sql-outside-allowlist": "error",
  "drizzle-conventions/no-nested-db-transaction": "error",
  "drizzle-conventions/schema-files-must-only-export-schema": "error",
  "drizzle-conventions/schema-files-must-not-import-driver": "error",
  "drizzle-conventions/account-scoped-tables-require-where": "error"
} as const;
