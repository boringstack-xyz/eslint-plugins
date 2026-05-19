import { describe, expect, it } from "vitest";

import plugin, { configs, rules } from "../src/index";
import { recommendedRules } from "../src/configs/recommended";

describe("plugin shape", () => {
  it("exports a plugin object with name and version meta", () => {
    expect(plugin.meta?.name).toBe("eslint-plugin-drizzle-conventions");
    expect(plugin.meta?.version).toBeTypeOf("string");
  });

  it("exposes every rule under kebab-case keys", () => {
    expect(Object.keys(plugin.rules ?? {}).sort()).toEqual([
      "account-scoped-tables-require-where",
      "no-nested-db-transaction",
      "no-raw-sql-outside-allowlist",
      "relations-must-cover-fks",
      "schema-files-must-not-import-driver",
      "schema-files-must-only-export-schema",
      "tables-must-have-timestamps",
      "timestamp-must-specify-mode"
    ]);
  });

  it("re-exports `rules` and `configs` as named exports", () => {
    expect(rules).toBe(plugin.rules);
    expect(configs).toBe(plugin.configs);
  });

  it("attaches a recommended config under the `drizzle-conventions` namespace", () => {
    const recommended = plugin.configs?.recommended;
    expect(recommended).toBeDefined();
    expect(recommended?.plugins?.["drizzle-conventions"]).toBe(plugin);
  });
});

describe("recommended config", () => {
  it("references every rule the plugin ships with", () => {
    const ruleKeys = Object.keys(rules);
    const recommendedKeys = Object.keys(recommendedRules).map((key) =>
      key.replace(/^drizzle-conventions\//, "")
    );

    expect(recommendedKeys.sort()).toEqual(ruleKeys.sort());
  });

  it("sets every recommended rule to `error` severity", () => {
    for (const value of Object.values(recommendedRules)) {
      expect(value).toBe("error");
    }
  });

  it("recommended-config rule keys all use the `drizzle-conventions/` prefix", () => {
    for (const key of Object.keys(recommendedRules)) {
      expect(key.startsWith("drizzle-conventions/")).toBe(true);
    }
  });
});

describe("rule meta integrity", () => {
  it("every rule declares meta.docs.description, schema, messages, and a docs URL", () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(rule.meta.docs?.description, `${name}: missing description`).toBeTypeOf(
        "string"
      );
      expect(rule.meta.docs?.url, `${name}: missing docs URL`).toContain(
        `docs/rules/${name}.md`
      );
      expect(rule.meta.schema, `${name}: missing schema`).toBeDefined();
      expect(rule.meta.messages, `${name}: missing messages`).toBeDefined();
    }
  });

  it("every rule is marked as recommended", () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(
        (rule.meta.docs as { recommended?: boolean } | undefined)?.recommended,
        `${name}: meta.docs.recommended should be true`
      ).toBe(true);
    }
  });

  it("no rule advertises being fixable (none have autofixers yet)", () => {
    for (const [name, rule] of Object.entries(rules)) {
      expect(rule.meta.fixable, `${name}: should not be fixable`).toBeUndefined();
    }
  });
});
