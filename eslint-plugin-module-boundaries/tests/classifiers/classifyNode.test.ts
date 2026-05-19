import { parse } from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import { analyzeSemanticModule } from "../../src/analysis/semanticModule";
import { sortCategories, type SemanticCategory } from "../../src/classifiers/categories";
import type { SingleSemanticModuleOptions } from "../../src/utils/config";

function categoriesFor(
  code: string,
  options?: SingleSemanticModuleOptions,
  filePath = "file.tsx"
): SemanticCategory[] {
  const program = parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    },
    filePath
  });

  return sortCategories(analyzeSemanticModule(program, options).categories);
}

describe("semantic classification", () => {
  it("classifies type declarations as type", () => {
    expect(
      categoriesFor(`
        export interface User {}
        export type UserId = string;
      `)
    ).toEqual(["type"]);
  });

  it("ignores type-only export specifiers", () => {
    expect(
      categoriesFor(`
        import type { User } from "./types";
        export type { User };
      `)
    ).toEqual([]);
  });

  it("ignores TS 5.5+ type-only named export specifiers", () => {
    expect(
      categoriesFor(`
        import type { User } from "./types";
        export { type User };
      `)
    ).toEqual([]);
  });

  it("classifies schema builder expressions from namespace imports", () => {
    expect(
      categoriesFor(`
        import * as z from "zod";
        export const UserSchema = z.object({});
      `)
    ).toEqual(["schema"]);
  });

  it("classifies schema builder expressions from default imports", () => {
    expect(
      categoriesFor(`
        import z from "zod";
        export const UserSchema = z.object({});
      `)
    ).toEqual(["schema"]);
  });

  it("does not classify schema-like calls without an import context", () => {
    expect(
      categoriesFor(`
        const z = { object: () => ({}) };
        export const UserSchema = z.object({});
      `)
    ).toEqual(["constant"]);
  });

  it("classifies schema builder expressions before constants", () => {
    expect(
      categoriesFor(`
        import { z } from "zod";
        export const UserSchema = z.object({});
      `)
    ).toEqual(["schema"]);
  });

  it("classifies multi-declarator exports with mixed concerns", () => {
    expect(
      categoriesFor(`
        export const USER_LIMIT = 5, validateUser = () => true;
      `)
    ).toEqual(["constant", "function"]);
  });

  it("classifies exported namespaces as type-only concerns (ignores nested members)", () => {
    expect(
      categoriesFor(`
        export namespace Models {
          export interface User {}
          export const DEFAULT_USER = {};
        }
      `)
    ).toEqual(["type"]);
  });

  it("classifies React components before functions", () => {
    expect(
      categoriesFor(`
        export function UserCard() {
          return <div />;
        }
      `)
    ).toEqual(["react-component"]);
  });

  it("does not classify non-JSX functions as React components", () => {
    expect(
      categoriesFor(`
        export function UserCard() {
          return "hi";
        }
      `, undefined, "file.ts")
    ).toEqual(["function"]);
  });

  it("classifies React.FC annotations as React components", () => {
    expect(
      categoriesFor(`
        import type { FC } from "react";
        export const UserCard: FC = () => null;
      `)
    ).toEqual(["react-component"]);
  });

  it("classifies hook names before ordinary functions", () => {
    expect(
      categoriesFor(`
        export const useUser = () => ({});
        export function useProject() {}
      `)
    ).toEqual(["hook"]);
  });

  it("keeps nested declarations out of top-level classification", () => {
    expect(
      categoriesFor(`
        export function createUser() {
          interface LocalUser {}
          const local = 1;
          return local;
        }
      `)
    ).toEqual(["function"]);
  });

  it("supports configurable enum-as-type classification", () => {
    expect(
      categoriesFor(
        `
          export interface User {}
          export enum UserRole { Admin = "admin" }
        `,
        { enumCategory: "type" }
      )
    ).toEqual(["type"]);
  });

  it("classifies default anonymous JSX functions as React components", () => {
    expect(
      categoriesFor(`
        export default function () {
          return <section />;
        }
      `)
    ).toEqual(["react-component"]);
  });
});
