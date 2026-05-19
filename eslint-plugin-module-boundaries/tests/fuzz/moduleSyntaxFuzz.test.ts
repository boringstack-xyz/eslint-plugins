import { parse } from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import { analyzeSemanticModule } from "../../src/analysis/semanticModule";
import { sortCategories, type SemanticCategory } from "../../src/classifiers/categories";

function xorshift32(seed: number): () => number {
  let x = seed >>> 0;

  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 2 ** 32;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function maybe(random: () => number, probability: number): boolean {
  return random() < probability;
}

function categoriesFor(code: string, filePath: string): SemanticCategory[] {
  const program = parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: false },
    filePath
  });

  return sortCategories(analyzeSemanticModule(program).categories);
}

function withNoise(random: () => number, line: string): string {
  const prefix = maybe(random, 0.3) ? "  " : "";
  const suffix = maybe(random, 0.3) ? " // comment" : "";
  const maybeBlankLine = maybe(random, 0.2) ? "\n" : "";
  return `${maybeBlankLine}${prefix}${line}${suffix}`;
}

describe("module syntax fuzz", () => {
  it("never throws and stays deterministic under import/export + TS module constructs", () => {
    const random = xorshift32(0x1234abcd);

    const headerSnippets = [
      `import type { User } from "./types"`,
      `import { z } from "zod"`,
      `import * as z from "zod"`,
      `import z from "zod"`
    ] as const;

    const exportSnippets = [
      `export type { User }`,
      `export { type User }`,
      `export { createUser } from "./createUser"`,
      `export * from "./other"`,
      `export {}`
    ] as const;

    const declarationSnippets = [
      `export interface User { id: string }`,
      `export type UserId = string`,
      `export const USER_LIMIT = 5`,
      `export function createUser() { return 1 }`,
      `export class UserService {}`,
      `export enum UserRole { Admin = "admin" }`,
      `export namespace Models { export interface User {} }`,
      `declare global { interface Window { appVersion: string } }`
    ] as const;

    for (let iteration = 0; iteration < 500; iteration += 1) {
      const headerCount = Math.floor(random() * 3);
      const exportCount = Math.floor(random() * 3);
      const declCount = 1 + Math.floor(random() * 6);

      const lines: string[] = [];

      for (let index = 0; index < headerCount; index += 1) {
        lines.push(withNoise(random, pick(random, headerSnippets)));
      }

      for (let index = 0; index < exportCount; index += 1) {
        lines.push(withNoise(random, pick(random, exportSnippets)));
      }

      for (let index = 0; index < declCount; index += 1) {
        lines.push(withNoise(random, pick(random, declarationSnippets)));
      }

      const code = `${lines.join("\n")}\n`;

      expect(() => categoriesFor(code, `module-fuzz-${iteration}.ts`)).not.toThrow();

      const first = categoriesFor(code, `module-fuzz-${iteration}.ts`);
      const second = categoriesFor(code, `module-fuzz-${iteration}.ts`);
      expect(second).toEqual(first);
    }
  });
});

