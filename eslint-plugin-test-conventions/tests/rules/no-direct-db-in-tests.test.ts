import {
  RULE_NAME,
  noDirectDbInTestsRule
} from "../../src/rules/no-direct-db-in-tests";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDirectDbInTestsRule, {
  valid: [
    {
      // Not a test file — rule should no-op.
      filename: "src/services/users.ts",
      code: `import { db } from "../db";`
    },
    {
      // Helpers file itself is allowed to import the forbidden modules.
      filename: "tests/helpers/db.ts",
      code: `import { drizzle } from "drizzle-orm";`
    },
    {
      filename: "tests/users/users.test.ts",
      code: `import { withDb } from "../helpers/db";`
    },
    {
      filename: "tests/users/users.test.ts",
      code: `import type { User } from "../../src/types";`
    },
    {
      filename: "tests/users/users.test.ts",
      code: `import { z } from "zod";`
    }
  ],
  invalid: [
    {
      filename: "tests/users/users.test.ts",
      code: `import { drizzle } from "drizzle-orm";`,
      errors: [{ messageId: "directDbInTests" }]
    },
    {
      filename: "tests/users/users.test.ts",
      code: `import db from "../../src/clients/postgres/index";`,
      errors: [{ messageId: "directDbInTests" }]
    },
    {
      filename: "tests/users/users.test.ts",
      code: `import * as schema from "../../src/db/schema";`,
      errors: [{ messageId: "directDbInTests" }]
    },
    {
      filename: "tests/users/users.test.ts",
      code: `export { drizzle } from "drizzle-orm";`,
      errors: [{ messageId: "directDbInTests" }]
    },
    {
      filename: "tests/users/users.test.ts",
      code: `export * from "drizzle-orm";`,
      errors: [{ messageId: "directDbInTests" }]
    },
    {
      filename: "tests/users/users.test.ts",
      code: `const m = await import("drizzle-orm");`,
      errors: [{ messageId: "directDbInTests" }]
    }
  ]
});
