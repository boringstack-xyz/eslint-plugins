import { RULE_NAME, noBareDateNowRule } from "../../src/rules/noBareDateNow";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noBareDateNowRule, {
  valid: [
    // Routed through a project util — the rule never sees the underlying
    // Date.now() because the source file imports a named helper.
    {
      code: `import { now } from "./time"; const t = now();`
    },
    // `new Date(timestamp)` with an explicit argument is fine — it's a
    // pure parser, not a clock read.
    {
      code: `const t = new Date(1700000000000);`
    },
    {
      code: `const t = new Date("2026-01-01T00:00:00Z");`
    },
    {
      code: `const t = Date.parse("2026-01-01");`
    },
    // Math.* calls that are NOT random are unaffected.
    {
      code: `const x = Math.floor(1.5);`
    },
    // File-allowlist exempts the wrapper itself from the rule.
    {
      code: `export const now = () => Date.now();`,
      filename: "src/lib/time/now.ts",
      options: [{ allowedPaths: ["src/lib/time/"] }]
    },
    {
      code: `export const random = () => Math.random();`,
      filename: "src/lib/random/index.ts",
      options: [{ allowedPaths: ["src/lib/random/"] }]
    },
    // Empty allowedPaths (the default) means the rule applies everywhere
    // — the valid cases above demonstrate non-violating call shapes.
    {
      code: `const t = Date.parse(input);`,
      options: [{}]
    }
  ],
  invalid: [
    {
      code: `const t = Date.now();`,
      errors: [{ messageId: "bareDateNow" }]
    },
    {
      code: `const t = new Date();`,
      errors: [{ messageId: "bareNewDate" }]
    },
    {
      code: `const t = Date();`,
      errors: [{ messageId: "bareDateConstructor" }]
    },
    {
      code: `const r = Math.random();`,
      errors: [{ messageId: "bareMathRandom" }]
    },
    {
      code: `function stamp() { return Date.now(); }`,
      errors: [{ messageId: "bareDateNow" }]
    },
    {
      code: `const id = "id-" + Math.random().toString(36).slice(2);`,
      errors: [{ messageId: "bareMathRandom" }]
    },
    // File path is in scope but NOT covered by allowedPaths.
    {
      code: `const t = Date.now();`,
      filename: "src/api/billing/billing.service.ts",
      options: [{ allowedPaths: ["src/lib/time/"] }],
      errors: [{ messageId: "bareDateNow" }]
    },
    // Multiple offenders in one source.
    {
      code: `
        function pick() {
          const id = Math.random();
          const at = Date.now();
          return { id, at };
        }
      `,
      errors: [
        { messageId: "bareMathRandom" },
        { messageId: "bareDateNow" }
      ]
    }
  ]
});
