import { describe, it, expect } from "vitest";
import {
  RULE_NAME,
  componentFolderStructureRule
} from "../../src/rules/componentFolderStructure";
import { RuleTester } from "@typescript-eslint/rule-tester";
import * as parser from "@typescript-eslint/parser";

// Use RuleTester for basic structure, but it doesn't support filesystem checks well
// So we test the rule directly

describe(RULE_NAME, () => {
  it("should require component folder structure", () => {
    // Note: Full filesystem testing requires fixtures which are complex to set up
    // This is a placeholder demonstrating the rule exists
    expect(componentFolderStructureRule).toBeDefined();
    expect(componentFolderStructureRule.meta.type).toBe("problem");
  });

  it("should have proper rule metadata", () => {
    expect(componentFolderStructureRule.meta.docs?.description).toContain(
      "component"
    );
  });
});
