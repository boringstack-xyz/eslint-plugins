import { describe, expect, it } from "vitest";

import plugin, { configs, rules } from "../src/index";
import { recommendedRules } from "../src/configs/recommended";

const EXPECTED_SEVERITIES: Record<string, "error" | "warn"> = {
  "no-direct-children-mutation": "error",
  "no-disabled-frustum-culling": "warn",
  "no-global-three": "warn",
  "no-mixed-three-entrypoints": "error",
  "no-unbounded-device-pixel-ratio": "warn",
  "prefer-named-three-imports": "warn",
  "prefer-three-load-async": "warn",
  "require-instance-buffer-update": "error",
  "require-projection-update": "error",
  "require-three-dispose-contract": "error",
  "require-three-loader-error-path": "error"
};

describe("plugin shape", () => {
  it("exports a plugin object with name and version meta", () => {
    expect(plugin.meta?.name).toBe("eslint-plugin-three");
    expect(plugin.meta?.version).toBeTypeOf("string");
  });

  it("exposes every rule under kebab-case keys", () => {
    expect(Object.keys(plugin.rules ?? {}).sort()).toEqual([
      "no-direct-children-mutation",
      "no-disabled-frustum-culling",
      "no-global-three",
      "no-mixed-three-entrypoints",
      "no-unbounded-device-pixel-ratio",
      "prefer-named-three-imports",
      "prefer-three-load-async",
      "require-instance-buffer-update",
      "require-projection-update",
      "require-three-dispose-contract",
      "require-three-loader-error-path"
    ]);
  });

  it("re-exports `rules` and `configs` as named exports", () => {
    expect(rules).toBe(plugin.rules);
    expect(configs).toBe(plugin.configs);
  });

  it("attaches a recommended config under the `three` namespace", () => {
    const recommended = plugin.configs?.recommended;
    expect(recommended).toBeDefined();
    expect(recommended?.plugins?.three).toBe(plugin);
  });
});

describe("recommended config", () => {
  it("references every rule the plugin ships with", () => {
    const ruleKeys = Object.keys(rules);
    const recommendedKeys = Object.keys(recommendedRules).map((key) =>
      key.replace(/^three\//, "")
    );

    expect(recommendedKeys.sort()).toEqual(ruleKeys.sort());
  });

  it("keeps the tsforge `three` pack severities", () => {
    for (const [key, value] of Object.entries(recommendedRules)) {
      const name = key.replace(/^three\//, "");
      expect(value, `${name}: unexpected severity`).toBe(EXPECTED_SEVERITIES[name]);
    }
  });

  it("recommended-config rule keys all use the `three/` prefix", () => {
    for (const key of Object.keys(recommendedRules)) {
      expect(key.startsWith("three/")).toBe(true);
    }
  });
});

describe("rule meta integrity", () => {
  it("every rule declares meta.docs.description, schema, messages, and a docs URL", () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(rule.meta.docs?.description, `${name}: missing description`).toBeTypeOf("string");
      expect(rule.meta.docs?.url, `${name}: missing docs URL`).toContain(
        `eslint-plugin-three/docs/rules/${name}.md`
      );
      expect(rule.meta.schema, `${name}: missing schema`).toBeDefined();
      expect(rule.meta.messages, `${name}: missing messages`).toBeDefined();
    }
  });

  it("every rule is marked as recommended", () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(
        rule.meta.docs?.recommended,
        `${name}: meta.docs.recommended should be true`
      ).toBe(true);
    }
  });
});
