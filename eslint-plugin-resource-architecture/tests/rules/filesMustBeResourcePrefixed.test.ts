import { RULE_NAME, filesMustBeResourcePrefixedRule } from "../../src/rules/filesMustBeResourcePrefixed";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, filesMustBeResourcePrefixedRule, {
  valid: [
    {
      filename: "src/api/users/users.routes.ts",
      code: `export const routes = {};`
    },
    {
      filename: "src/api/users/users.service.ts",
      code: `export const service = {};`
    },
    {
      filename: "src/api/users/index.ts",
      code: `export {};`
    },
    {
      filename: "src/other/routes.ts",
      code: `export {};`
    }
  ],
  invalid: [
    {
      filename: "src/api/users/routes.ts",
      code: `export {};`,
      errors: [{ messageId: "missingResourcePrefix" }]
    },
    {
      filename: "src/api/projects/service.ts",
      code: `export {};`,
      errors: [{ messageId: "missingResourcePrefix" }]
    },
    {
      filename: "src/api/posts/schemas.ts",
      code: `export {};`,
      errors: [{ messageId: "missingResourcePrefix" }]
    }
  ]
});

