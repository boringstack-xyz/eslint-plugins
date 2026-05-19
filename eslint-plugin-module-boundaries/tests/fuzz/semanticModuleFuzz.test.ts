import { parse } from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import { analyzeSemanticModule } from "../../src/analysis/semanticModule";
import { sortCategories, type SemanticCategory } from "../../src/classifiers/categories";

function xorshift32(seed: number): () => number {
  let x = seed >>> 0;

  return () => {
    // xorshift32
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // Convert to [0, 1)
    return (x >>> 0) / 2 ** 32;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function shuffle<T>(random: () => number, values: readonly T[]): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = result[index];
    result[index] = result[swapIndex]!;
    result[swapIndex] = temp!;
  }

  return result;
}

function categoriesFor(code: string, filePath: string): SemanticCategory[] {
  const program = parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: filePath.endsWith(".tsx") },
    filePath
  });

  return sortCategories(analyzeSemanticModule(program).categories);
}

describe("semantic module fuzz", () => {
  it("never throws and is deterministic across random modules", () => {
    const random = xorshift32(0x0ddba11);

    const statements = [
      `export interface User { id: string }`,
      `export type UserId = string`,
      `export const USER_LIMIT = 5`,
      `export const DEFAULT_USER = {}`,
      `export function createUser() { return 1 }`,
      `export class UserService {}`,
      `export enum UserRole { Admin = "admin" }`,
      `export const useUser = () => ({})`,
      // Schema with import context (we'll hoist imports to the top)
      `import { z } from "zod";\nexport const UserSchema = z.object({});`,
      // Schema false-positive guard (no import context => should remain constant)
      `const z = { object: () => ({}) };\nexport const LocalSchema = z.object({});`,
      // Ambient declaration path
      `declare const runtimeValue: string;\nexport function runtime() { return runtimeValue }`
    ] as const;

    for (let iteration = 0; iteration < 600; iteration += 1) {
      const count = 1 + Math.floor(random() * 7);

      const chosen = Array.from({ length: count }, () => pick(random, statements));
      const shuffled = shuffle(random, chosen);

      const importLines: string[] = [];
      const bodyLines: string[] = [];

      for (const snippet of shuffled) {
        const lines = snippet.split("\n");

        for (const line of lines) {
          if (line.trimStart().startsWith("import ")) {
            importLines.push(line);
          } else {
            bodyLines.push(line);
          }
        }
      }

      const code = `${importLines.join("\n")}\n${bodyLines.join("\n")}\n`;

      // Determinism: same input should yield same categories.
      expect(() => categoriesFor(code, `fuzz-${iteration}.ts`)).not.toThrow();

      const first = categoriesFor(code, `fuzz-${iteration}.ts`);
      const second = categoriesFor(code, `fuzz-${iteration}.ts`);

      expect(second).toEqual(first);

      // Sanity: when we detect >1 category, we should have at least 2
      // classifications, so the rule can report on a concrete node.
      const program = parse(code, {
        ecmaVersion: "latest",
        sourceType: "module",
        filePath: `fuzz-${iteration}.ts`
      });

      const analysis = analyzeSemanticModule(program);
      if (analysis.categories.size > 1) {
        expect(analysis.classifications.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

