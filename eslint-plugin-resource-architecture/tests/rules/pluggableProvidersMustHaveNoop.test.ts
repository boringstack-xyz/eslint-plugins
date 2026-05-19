import {
  RULE_NAME,
  __resetFsAdapterForTests,
  __setFsAdapterForTests,
  pluggableProvidersMustHaveNoopRule
} from "../../src/rules/pluggableProvidersMustHaveNoop";
import { ruleTester } from "../test-utils/ruleTester";
import { afterAll, beforeAll, describe } from "vitest";

const providersDir = "src/lib/cache/providers";

describe(RULE_NAME, () => {
  beforeAll(() => {
    __setFsAdapterForTests({
      existsSync: (filename) => filename.replaceAll("\\", "/").endsWith("/noop.ts"),
      readdirSync: (dir) => {
        const normalized = dir.replaceAll("\\", "/");
        if (!normalized.endsWith("/providers")) {
          return [];
        }
        return ["a.ts", "b.ts", "noop.ts"];
      }
    });
  });

  afterAll(() => {
    __resetFsAdapterForTests();
  });

  ruleTester.run(RULE_NAME, pluggableProvidersMustHaveNoopRule, {
    valid: [
      {
        filename: "src/lib/cache/providers/a.ts",
        code: `export {};`
      },
      {
        filename: "src/lib/cache/providers/b.ts",
        code: `export {};`
      },
      {
        filename: "src/lib/cache/other.ts",
        code: `export {};`
      }
    ],
    invalid: []
  });
});

describe(`${RULE_NAME}-missing`, () => {
  beforeAll(() => {
    __setFsAdapterForTests({
      existsSync: () => false,
      readdirSync: (dir) => {
        const normalized = dir.replaceAll("\\", "/");
        if (!normalized.endsWith("/providers")) {
          return [];
        }
        return ["a.ts", "b.ts"];
      }
    });
  });

  afterAll(() => {
    __resetFsAdapterForTests();
  });

  // Missing noop: report only for first alphabetical file
  ruleTester.run(`${RULE_NAME}-missing`, pluggableProvidersMustHaveNoopRule, {
    valid: [
      {
        filename: "src/lib/cache/providers/b.ts",
        code: `export {};`
      }
    ],
    invalid: [
      {
        filename: "src/lib/cache/providers/a.ts",
        code: `export {};`,
        errors: [{ messageId: "missingNoop" }]
      }
    ]
  });
});

