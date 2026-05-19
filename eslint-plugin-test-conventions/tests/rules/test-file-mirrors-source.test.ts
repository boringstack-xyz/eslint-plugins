import {
  RULE_NAME,
  setFileExistsForTesting,
  testFileMirrorsSourceRule
} from "../../src/rules/test-file-mirrors-source";
import { ruleTester } from "../test-utils/ruleTester";

const cwd = process.cwd();
const abs = (rel: string): string => `${cwd}/${rel}`;

const knownFiles = new Set<string>([
  abs("src/users/users.service.ts"),
  abs("src/users/users.ts"),
  abs("packages/core/src/shared/utils.ts")
]);

setFileExistsForTesting((p) => knownFiles.has(p));

ruleTester.run(RULE_NAME, testFileMirrorsSourceRule, {
  valid: [
    {
      // Mirrored source exists in default `src/`.
      filename: "tests/users/users.service.test.ts",
      code: "// test body"
    },
    {
      // Not under testRoot — rule no-ops.
      filename: "src/users/users.service.ts",
      code: "export const x = 1;"
    },
    {
      // Doesn't end in suffix — rule no-ops.
      filename: "tests/helpers/db.ts",
      code: "export const helper = 1;"
    },
    {
      // Custom suffix.
      filename: "tests/users/users.spec.ts",
      options: [{ testSuffix: ".spec.ts" }],
      code: "// test"
    },
    {
      // Falls back to additionalSourceRoots.
      filename: "tests/shared/utils.test.ts",
      options: [{ additionalSourceRoots: ["packages/core/src"] }],
      code: "// test"
    }
  ],
  invalid: [
    {
      filename: "tests/users/orphan.test.ts",
      code: "// orphaned",
      errors: [{ messageId: "orphanedTest" }]
    },
    {
      filename: "tests/api/widgets.test.ts",
      code: "// renamed source",
      errors: [{ messageId: "orphanedTest" }]
    },
    {
      filename: "tests/users/users.spec.ts",
      options: [{ testSuffix: ".spec.ts", sourceRoot: "lib" }],
      code: "// custom suffix + sourceRoot, no source",
      errors: [{ messageId: "orphanedTest" }]
    },
    {
      filename: "tests/shared/missing.test.ts",
      options: [{ additionalSourceRoots: ["packages/core/src"] }],
      code: "// no fallback either",
      errors: [{ messageId: "orphanedTest" }]
    }
  ]
});
