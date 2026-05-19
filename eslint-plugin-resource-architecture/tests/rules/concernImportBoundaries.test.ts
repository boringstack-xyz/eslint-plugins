import { RULE_NAME, concernImportBoundariesRule } from "../../src/rules/concernImportBoundaries";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, concernImportBoundariesRule, {
  valid: [
    {
      filename: "src/api/users/users.schemas.ts",
      code: `export const UserSchema = {};`
    },
    {
      filename: "src/api/users/users.types.ts",
      code: `
        export type UserId = string;
      `
    },
    {
      filename: "src/api/users/users.routes.ts",
      code: `
        import { Elysia } from "elysia";
        export const app = new Elysia();
      `
    }
  ],
  invalid: [
    {
      filename: "src/api/users/users.schemas.ts",
      code: `import { sql } from "drizzle-orm"; export const x = sql\`select 1\`;`,
      errors: [{ messageId: "forbiddenImport" }]
    },
    {
      filename: "src/api/users/users.routes.ts",
      code: `import { sql } from "drizzle-orm"; export const x = sql\`select 1\`;`,
      errors: [{ messageId: "forbiddenImport" }]
    },
    {
      filename: "src/api/users/users.types.ts",
      code: `import { Elysia } from "elysia"; export const x = new Elysia();`,
      errors: [{ messageId: "forbiddenImport" }]
    },
    {
      filename: "src/api/users/users.constants.ts",
      code: `import { Elysia } from "elysia"; export const x = new Elysia();`,
      errors: [{ messageId: "forbiddenImport" }]
    }
    ,
    {
      filename: "src/api/users/users.types.ts",
      code: `
        import type { User } from "./users.schemas";
        export type { User };
      `,
      errors: [{ messageId: "forbiddenImport" }]
    }
  ]
});

