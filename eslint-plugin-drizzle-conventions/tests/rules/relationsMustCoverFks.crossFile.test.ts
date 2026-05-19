import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RULE_NAME,
  relationsMustCoverFksRule,
  __clearRelationsFileCacheForTests
} from "../../src/rules/relationsMustCoverFks";
import { ruleTester } from "../test-utils/ruleTester";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, "../fixtures/cross-file-relations");
const postsSchemaPath = path.join(fixtureDir, "posts.schema.ts");

__clearRelationsFileCacheForTests();

ruleTester.run(`${RULE_NAME} (cross-file)`, relationsMustCoverFksRule, {
  valid: [
    // The schema file declares a table with a FK; the relations call lives
    // in a sibling `relations.ts`. Default `allowExternalFile: true`
    // discovers it via the filesystem walk.
    {
      filename: postsSchemaPath,
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorId: uuid("author_id").notNull(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
      `
    }
  ],
  invalid: [
    // Same code; with `allowExternalFile: false` the rule is in-file only
    // and reports.
    {
      filename: postsSchemaPath,
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        export const posts = pgTable("posts", {
          id: uuid("id").primaryKey(),
          authorId: uuid("author_id").notNull(),
          authorFk: foreignKey({ columns: [], foreignColumns: [] })
        });
      `,
      options: [{ allowExternalFile: false }],
      errors: [{ messageId: "missingRelations", data: { name: "posts" } }]
    },
    // A FK on a table the sibling relations.ts does NOT cover still
    // errors even with the cross-file scan.
    {
      filename: postsSchemaPath,
      code: `
        import { pgTable, uuid, foreignKey } from "drizzle-orm/pg-core";
        export const comments = pgTable("comments", {
          id: uuid("id").primaryKey(),
          postFk: foreignKey({ columns: [], foreignColumns: [] })
        });
      `,
      errors: [{ messageId: "missingRelations", data: { name: "comments" } }]
    }
  ]
});
