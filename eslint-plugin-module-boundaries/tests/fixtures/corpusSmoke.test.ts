import { parse } from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { analyzeSemanticModule } from "../../src/analysis/semanticModule";
import { sortCategories, type SemanticCategory } from "../../src/classifiers/categories";

const corpusDir = path.join(__dirname, "corpus");

const expectedByBasename: Partial<Record<string, SemanticCategory[]>> = {
  "01-types-only.ts": ["type"],
  "02-constants-only.ts": ["constant"],
  "03-functions-only.ts": ["function"],
  "04-overloads.ts": ["function"],
  "05-mixed-type-constant.ts": ["type", "constant"],
  "06-multi-declarator-mixed.ts": ["constant", "function"],
  "07-react-component.tsx": ["react-component"],
  "08-hooks.ts": ["hook"],
  "09-schema-zod.ts": ["schema"],
  "10-schema-default-import.ts": ["schema"],
  "11-schema-namespace-import.ts": ["schema"],
  "12-schema-false-positive-guard.ts": ["constant"],
  "13-ambient-declarations.ts": ["type", "function"],
  "14-namespace-mixed-members.ts": ["type"],
  "15-modern-ts-syntax.ts": ["type", "constant"],
  "16-const-enum.ts": ["enum"],
  "20-global-augmentation.ts": ["type"]
};

function categoriesFor(code: string, filePath: string): SemanticCategory[] {
  const program = parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: filePath.endsWith(".tsx") },
    filePath
  });

  return sortCategories(analyzeSemanticModule(program).categories);
}

describe("fixture corpus smoke", () => {
  it("parses and analyzes all corpus fixtures without throwing", async () => {
    const basenames = (await readdir(corpusDir)).filter((name) =>
      name.endsWith(".ts") || name.endsWith(".tsx")
    );

    expect(basenames.length).toBeGreaterThanOrEqual(10);

    for (const basename of basenames) {
      const filePath = path.join(corpusDir, basename);
      const code = await readFile(filePath, "utf8");

      expect(() => categoriesFor(code, filePath)).not.toThrow();
    }
  });

  it("matches expected categories for key fixtures", async () => {
    const entries = Object.entries(expectedByBasename);

    for (const [basename, expected] of entries) {
      if (!expected) {
        continue;
      }

      const filePath = path.join(corpusDir, basename);
      const code = await readFile(filePath, "utf8");

      expect(categoriesFor(code, filePath)).toEqual(expected);
    }
  });
});

