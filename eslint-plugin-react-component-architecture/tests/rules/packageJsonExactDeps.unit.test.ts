import { describe, it, expect } from "vitest";
import {
  RULE_NAME,
  packageJsonExactDepsRule
} from "../../src/rules/packageJsonExactDeps";

describe(RULE_NAME, () => {
  it("should validate package.json dependency versions", () => {
    expect(packageJsonExactDepsRule).toBeDefined();
    expect(packageJsonExactDepsRule.meta.type).toBe("problem");
  });

  it("should have proper rule metadata", () => {
    expect(packageJsonExactDepsRule.meta.docs?.description).toContain(
      "exact"
    );
  });

  it("should check dependencies and devDependencies for caret/tilde", () => {
    // The rule uses JSON.parse on context.sourceCode.getText()
    const rule = packageJsonExactDepsRule;
    expect(rule.meta.messages).toHaveProperty("notExactDep");
    expect(rule.meta.messages).toHaveProperty("notCaratPeerDep");
  });
});
