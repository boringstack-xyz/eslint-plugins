import {
  RULE_NAME,
  noDirectProcessEnvRule
} from "../../src/rules/no-direct-process-env";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDirectProcessEnvRule, {
  valid: [
    {
      // Allowed file matches default glob.
      filename: "src/config/env/index.ts",
      code: `const port = process.env.PORT;`
    },
    {
      // *.config.* allowlisted.
      filename: "vitest.config.ts",
      code: `const x = process.env.MODE;`
    },
    {
      // scripts/** allowlisted.
      filename: "scripts/seed.ts",
      code: `const url = process.env.DATABASE_URL;`
    },
    {
      filename: "src/services/users.ts",
      code: `import { env } from "@/config/env"; const port = env.PORT;`
    },
    {
      filename: "src/services/users.ts",
      code: `const obj = { process: { env: {} } }; const x = obj.process.env;`
    }
  ],
  invalid: [
    {
      filename: "src/services/users.ts",
      code: `const port = process.env.PORT;`,
      errors: [{ messageId: "directProcessEnv" }]
    },
    {
      filename: "src/services/users.ts",
      code: `const port = process.env["PORT"];`,
      errors: [{ messageId: "directProcessEnv" }]
    },
    {
      filename: "src/services/users.ts",
      code: `const { PORT, DATABASE_URL } = process.env;`,
      errors: [{ messageId: "directProcessEnv" }]
    },
    {
      filename: "src/services/users.ts",
      code: `let cfg; ({ PORT: cfg } = process.env);`,
      errors: [{ messageId: "directProcessEnv" }]
    },
    {
      filename: "src/services/users.ts",
      code: `process.env.NODE_ENV = "test";`,
      errors: [{ messageId: "directProcessEnv" }]
    },
    {
      filename: "src/services/users.ts",
      options: [{ singletonSuggestion: "import { env } from '#config'" }],
      code: `const x = process.env.X;`,
      errors: [{ messageId: "directProcessEnv" }]
    }
  ]
});
