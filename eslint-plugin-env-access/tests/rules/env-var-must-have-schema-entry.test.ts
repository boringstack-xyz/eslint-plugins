import path from "node:path";

import {
  RULE_NAME,
  envVarMustHaveSchemaEntryRule,
  setSchemaReaderForTesting
} from "../../src/rules/env-var-must-have-schema-entry";
import { ruleTester } from "../test-utils/ruleTester";

const cwd = process.cwd();
const schemaPath = path.resolve(cwd, "src/config/env/schema.ts");

const SCHEMA = `
export const envSchema = Type.Object({
  NODE_ENV: Type.String(),
  PORT: Type.Number(),
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String()
});
`;

setSchemaReaderForTesting(
  (p) => (p === schemaPath ? SCHEMA : null),
  () => 1
);

ruleTester.run(RULE_NAME, envVarMustHaveSchemaEntryRule, {
  valid: [
    {
      code: `import { env } from "@/config/env"; const x = env.PORT;`
    },
    {
      code: `import { env } from "@/config/env"; const x = env.DATABASE_URL;`
    },
    {
      // Identifier `env` not bound to the singleton import.
      code: `const env = { TYPO: 1 }; const x = env.TYPO;`
    },
    {
      // Computed access — we don't analyse dynamic property reads.
      code: `import { env } from "@/config/env"; const k = "X"; const v = env[k];`
    },
    {
      // Aliased local binding still works because we track local names.
      code: `import { env as cfg } from "@/config/env"; const x = cfg.PORT;`
    }
  ],
  invalid: [
    {
      code: `import { env } from "@/config/env"; const x = env.TYPO;`,
      errors: [{ messageId: "missingSchemaEntry" }]
    },
    {
      code: `import { env } from "@/config/env"; const x = env.NODEENV;`,
      errors: [{ messageId: "missingSchemaEntry" }]
    },
    {
      code: `import { env as cfg } from "@/config/env"; const x = cfg.MISSING;`,
      errors: [{ messageId: "missingSchemaEntry" }]
    }
  ]
});
