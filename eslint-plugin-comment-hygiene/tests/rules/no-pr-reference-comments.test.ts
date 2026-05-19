import {
  RULE_NAME,
  noPrReferenceCommentsRule
} from "../../src/rules/no-pr-reference-comments";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noPrReferenceCommentsRule, {
  valid: [
    { code: `// Validated by the smoke test in CI.` },
    { code: `// Drops to read-only when role !== admin.` },
    { code: `// see README.md for the production checklist.` },
    { code: `// route path: /api/v1/users/:id` },
    { code: `/** @see {@link normalizeEmail} */` },
    { code: `// #dnsteam owns DNS rotation, not us.` }
  ],
  invalid: [
    {
      code: `// PR #123 introduced this guard`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// see #456 for the rationale`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// closes #789`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// addresses #42 (auth bypass)`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// fixes #1`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// see https://github.com/foo/bar/pull/12 for context`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// see https://github.com/foo/bar/issues/3`,
      errors: [{ messageId: "prReferenceComment" }]
    },
    {
      code: `// (see #99)`,
      errors: [{ messageId: "prReferenceComment" }]
    }
  ]
});
