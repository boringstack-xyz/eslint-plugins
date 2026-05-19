import { parse } from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import { analyzeSemanticModule } from "../../src/analysis/semanticModule";
import { sortCategories, type SemanticCategory } from "../../src/classifiers/categories";

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 2 ** 32;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
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

describe("tsx/react fuzz", () => {
  it("handles ts/tsx switching without throwing", () => {
    const random = mulberry32(0xfeedbabe);

    const tsOnlySnippets = [
      `export interface User { id: string }`,
      `export type UserId = string`,
      `export const USER_LIMIT = 5`,
      `export function createUser() { return 1 }`
    ] as const;

    const tsxOnlySnippets = [
      `export function UserCard() { return <div /> }`,
      `export const ProjectCard = () => <section />`
    ] as const;

    for (let iteration = 0; iteration < 300; iteration += 1) {
      const isTsx = random() < 0.5;
      const filePath = isTsx ? `fuzz-${iteration}.tsx` : `fuzz-${iteration}.ts`;

      const count = 1 + Math.floor(random() * 5);
      const parts: string[] = [];

      for (let index = 0; index < count; index += 1) {
        if (isTsx && random() < 0.6) {
          parts.push(pick(random, tsxOnlySnippets));
        } else {
          parts.push(pick(random, tsOnlySnippets));
        }
      }

      const code = `${parts.join("\n")}\n`;

      expect(() => categoriesFor(code, filePath)).not.toThrow();

      const categories = categoriesFor(code, filePath);

      // Sanity: JSX can only be parsed/recognized in .tsx (per our filePath heuristic).
      if (!isTsx) {
        expect(categories.includes("react-component")).toBe(false);
      }
    }
  });
});

