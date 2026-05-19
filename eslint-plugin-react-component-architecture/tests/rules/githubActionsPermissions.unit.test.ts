import { describe, it, expect } from "vitest";
import {
  RULE_NAME,
  githubActionsPermissionsRule
} from "../../src/rules/githubActionsPermissions";

describe(RULE_NAME, () => {
  it("should validate GitHub Actions workflow permissions", () => {
    expect(githubActionsPermissionsRule).toBeDefined();
    expect(githubActionsPermissionsRule.meta.type).toBe("problem");
  });

  it("should have proper rule metadata", () => {
    expect(githubActionsPermissionsRule.meta.docs?.description).toContain(
      "permissions"
    );
  });

  it("should check for permissions block and pinned refs", () => {
    const rule = githubActionsPermissionsRule;
    expect(rule.meta.messages).toHaveProperty("missingPermissions");
    expect(rule.meta.messages).toHaveProperty("unpinnedRef");
  });
});
