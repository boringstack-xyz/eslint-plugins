import {
  RULE_NAME,
  noDirectErrorThrowRule
} from "../../src/rules/noDirectErrorThrow";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDirectErrorThrowRule, {
  valid: [
    // Default scope is "all": this rule fires everywhere unless `scope: "elysia-only"`
    // is explicitly opted in. Files using the factory are always fine.
    {
      code: `
        import { ApiErrors } from "./errors";
        export function fail() { throw ApiErrors.internal("nope"); }
      `
    },
    {
      code: `
        import { ApiErrors } from "./errors";
        export function fail(reason: unknown) {
          throw ApiErrors.badRequest("Validation failed", { cause: reason });
        }
      `
    },
    // Re-throwing an already-typed error
    {
      code: `
        export function rethrow(err: unknown) { throw err; }
      `
    },
    // Custom domain error (not in `forbiddenCtors`)
    {
      code: `
        class MyDomainError extends Error {}
        export function fail() { throw new MyDomainError("nope"); }
      `
    },
    // Non-Error constructor not in the forbidden list
    {
      code: `
        export function fail() { throw new Error("only when"); }
      `,
      options: [{ forbiddenCtors: ["TypeError"] }]
    },
    // scope: "elysia-only" — opt-in narrower scope. Library files that
    // don't import elysia stay clean.
    {
      code: `
        export function fail() { throw new Error("library-side"); }
      `,
      options: [{ scope: "elysia-only" }]
    },
    {
      code: `
        export const get = async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        };
      `,
      options: [{ scope: "elysia-only" }]
    }
  ],
  invalid: [
    // Default behavior: fires anywhere
    {
      code: `
        export function fail() { throw new Error("nope"); }
      `,
      output: `
        export function fail() { throw ApiErrors.internal("nope"); }
      `,
      errors: [
        {
          messageId: "directThrow",
          data: { ctor: "Error", factory: "ApiErrors", method: "internal" }
        }
      ]
    },
    {
      code: `
        export function fail() { throw new TypeError("bad"); }
      `,
      output: `
        export function fail() { throw ApiErrors.internal("bad"); }
      `,
      errors: [{ messageId: "directThrow" }]
    },
    {
      code: `
        export function fail(why: string) { throw new Error(why); }
      `,
      output: null,
      errors: [{ messageId: "directThrow" }]
    },
    {
      code: `
        export function fail() { throw new Error("nope", { cause: 1 }); }
      `,
      output: null,
      errors: [{ messageId: "directThrow" }]
    },
    {
      code: `
        export function fail() { throw new Error("oh"); }
      `,
      output: `
        export function fail() { throw HttpErrors.bad("oh"); }
      `,
      options: [{ factoryName: "HttpErrors", factoryMethod: "bad" }],
      errors: [{ messageId: "directThrow" }]
    },
    // scope: "elysia-only" — Elysia-importing files still trigger
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        export function fail() { throw new Error("nope"); }
      `,
      output: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        export function fail() { throw ApiErrors.internal("nope"); }
      `,
      options: [{ scope: "elysia-only" }],
      errors: [{ messageId: "directThrow" }]
    },
    // @elysiajs/* counts as "elysia-only" scope too
    {
      code: `
        import { swagger } from "@elysiajs/swagger";
        export function fail() { throw new Error("nope"); }
      `,
      output: `
        import { swagger } from "@elysiajs/swagger";
        export function fail() { throw ApiErrors.internal("nope"); }
      `,
      options: [{ scope: "elysia-only" }],
      errors: [{ messageId: "directThrow" }]
    }
  ]
});
