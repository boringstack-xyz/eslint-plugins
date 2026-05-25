import { noProcessExitRule } from "../../src/rules/no-process-exit";
import { RULE_NAME } from "../../src/rules/no-process-exit";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noProcessExitRule, {
  valid: [
    {
      filename: "src/config/error-handlers/error-handlers.ts",
      code: "process.exit(0);",
    },
    {
      filename: "scripts/seed.ts",
      code: "process.exit(1);",
    },
    {
      filename: "src/app.ts",
      code: "process.on('SIGTERM', () => {});",
    },
  ],
  invalid: [
    {
      filename: "src/api/users/users.service.ts",
      code: "process.exit(1);",
      errors: [{ messageId: "processExit" }],
    },
  ],
});
