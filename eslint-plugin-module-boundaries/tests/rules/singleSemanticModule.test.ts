import { RULE_NAME, singleSemanticModuleRule } from "../../src/rules/singleSemanticModule";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, singleSemanticModuleRule, {
  valid: [
    {
      code: `
        export interface User {}
        export type UserId = string;
      `
    },
    {
      code: `
        import type { User } from "./types";
        export type { User };
        export { createUser } from "./createUser";
      `
    },
    {
      code: `
        import type { User } from "./types";
        export { type User };
        export { createUser } from "./createUser";
      `
    },
    {
      code: `
        export const USER_ROLE_ADMIN = "admin";
        export const USER_ROLE_USER = "user";
      `
    },
    {
      code: `
        export function createUser() {}
        export function deleteUser() {}
      `
    },
    {
      code: `
        export const a = () => true, b = () => false;
      `
    },
    {
      code: `
        export const createUser = () => {};
        export const deleteUser = function deleteUser() {};
      `
    },
    {
      code: `
        export class UserService {}
        export class ProjectService {}
      `
    },
    {
      filename: "component.tsx",
      code: `
        export function UserCard() {
          return <div />;
        }

        export const ProjectCard = () => <section />;
      `
    },
    {
      code: `
        export function useUser() {}
        export const useProject = () => {};
      `
    },
    {
      code: `
        import { z } from "zod";
        export const UserSchema = z.object({});
        export const ProjectSchema = z.object({});
      `
    },
    {
      code: `
        import * as z from "zod";
        export const UserSchema = z.object({});
      `
    },
    {
      code: `
        import z from "zod";
        export const UserSchema = z.object({});
      `
    },
    {
      code: `
        import type { User } from "./types";
        export type { User };
        export { createUser } from "./createUser";
        export * from "./other";
      `
    },
    {
      code: `
        import type { User } from "./types";
        export { type User };
        export { createUser } from "./createUser";
        export * from "./other";
      `
    },
    {
      code: `
        export function createUser() {
          type Local = string;
          const value = 1;
          return value;
        }
      `
    },
    {
      code: `
        export function parse(value: string): string;
        export function parse(value: number): string;
        export function parse(value: string | number): string {
          return String(value);
        }
      `
    },
    {
      code: `
        export default function parse(value: string): string;
        export default function parse(value: number): string;
        export default function parse(value: string | number): string {
          return String(value);
        }
      `
    },
    {
      code: `
        export {};
        declare global {
          interface Window {
            appVersion: string;
          }
        }
      `
    },
    {
      code: `
        declare const runtimeValue: string;
        export function createUser() {}
      `,
      options: [{ ignoreAmbientDeclarations: true }]
    },
    {
      code: `
        export interface User {}
        export enum UserRole {
          Admin = "admin"
        }
      `,
      options: [{ enumCategory: "type" }]
    },
    {
      code: `
        import { z } from "zod";
        export interface User {}
        export const UserSchema = z.object({});
      `,
      options: [{ allow: [["type", "schema"]] }]
    },
    {
      code: `
        import { z } from "zod";
        export interface User {}
        export const UserSchema = z.object({});
      `,
      options: [{ allow: [["schema", "type"]] }]
    },
    {
      filename: "component.tsx",
      code: `
        export function UserCard() {
          return <div />;
        }

        export function useUserCard() {}
      `,
      options: [{ allow: [["react-component", "hook"]] }]
    },
    {
      code: `
        export namespace Models {
          export interface User {}
        }
      `
    },
    {
      code: `
        export namespace Models {
          export interface User {}
          export const DEFAULT_USER = {};
        }
      `
    },
    {
      code: `
        export default class UserService {}
      `
    }
  ],
  invalid: [
    {
      code: `
        export interface User {}
        export const DEFAULT_USER = {};
      `,
      errors: [
        {
          messageId: "mixedSemanticCategories",
          data: {
            message:
              "Mixed semantic categories detected in module:\n- type\n- constant\n\nA module must contain only one semantic concern.\nMove declarations into separate files/modules."
          }
        }
      ]
    },
    {
      code: `
        export const USER_LIMIT = 5;
        export function validateUser() {}
      `,
      errors: [{ messageId: "mixedSemanticCategories" }]
    },
    {
      code: `
        export class UserService {}
        export function createUser() {}
      `,
      errors: [{ messageId: "mixedSemanticCategories" }]
    },
    {
      filename: "component.tsx",
      code: `
        export function UserCard() {
          return <div />;
        }

        export function useUser() {}
      `,
      errors: [{ messageId: "mixedSemanticCategories" }]
    },
    {
      code: `
        import { z } from "zod";
        export const UserSchema = z.object({});
        export function validateUser() {}
      `,
      errors: [{ messageId: "mixedSemanticCategories" }]
    },
    {
      code: `
        export enum UserRole {
          Admin = "admin"
        }
        export function getRole() {}
      `,
      errors: [{ messageId: "mixedSemanticCategories" }]
    },
    {
      code: `
        export const USER_LIMIT = 5, validateUser = () => true;
      `,
      errors: [
        {
          messageId: "mixedSemanticCategories",
          data: {
            message:
              "Mixed semantic categories detected in module:\n- constant\n- function\n\nA module must contain only one semantic concern.\nMove declarations into separate files/modules."
          }
        }
      ]
    },
    {
      code: `
        import { z } from "zod";
        export interface User {}
        export default z.object({});
      `,
      errors: [
        {
          messageId: "mixedSemanticCategories",
          data: {
            message:
              "Mixed semantic categories detected in module:\n- type\n- schema\n\nA module must contain only one semantic concern.\nMove declarations into separate files/modules."
          }
        }
      ]
    },
    {
      code: `
        export interface User {}
        export const DEFAULT_USER = {};
      `,
      options: [{ debug: true }],
      errors: [
        {
          messageId: "mixedSemanticCategories",
          data: {
            message:
              "Mixed semantic categories detected in module:\n- type\n- constant\n\nDetected declarations:\n- type: User (TypeScript type-space declaration)\n- constant: DEFAULT_USER (object literal runtime value)\n\nA module must contain only one semantic concern.\nMove declarations into separate files/modules."
          }
        }
      ]
    },
    {
      code: `
        declare const runtimeValue: string;
        export function createUser() {}
      `,
      errors: [{ messageId: "mixedSemanticCategories" }]
    }
  ]
});
