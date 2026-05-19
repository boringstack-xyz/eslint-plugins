import {
  RULE_NAME,
  maxHooksPerFileRule
} from "../../src/rules/maxHooksPerFile";
import { ruleTester } from "../test-utils/ruleTester";

const filename = "Foo.queries.ts";
const unrelatedFilename = "Foo.utils.ts";

ruleTester.run(RULE_NAME, maxHooksPerFileRule, {
  valid: [
    {
      filename,
      code: `
        export function useA() {}
        export function useB() {}
        export function useC() {}
        export function useD() {}
      `,
      options: [{ threshold: 4 }]
    },
    {
      filename,
      code: `
        export const useA = () => {};
        export const useB = () => {};
        export function notAHook() {}
        export const CONSTANT = 1;
      `,
      options: [{ threshold: 4 }]
    },
    {
      filename: unrelatedFilename,
      code: `
        export function useA() {}
        export function useB() {}
        export function useC() {}
        export function useD() {}
        export function useE() {}
      `,
      options: [{ threshold: 4 }]
    },
    {
      filename,
      code: `
        function useInternal() {}
        export function useA() {}
        export function useB() {}
      `,
      options: [{ threshold: 4 }]
    },
    {
      filename,
      code: `
        export function user() {}
        export function used() {}
        export function userValid() {}
      `,
      options: [{ threshold: 4 }]
    }
  ],
  invalid: [
    {
      filename,
      code: `
        export function useA() {}
        export function useB() {}
        export function useC() {}
        export function useD() {}
        export function useE() {}
      `,
      options: [{ threshold: 4 }],
      errors: [{ messageId: "tooManyHooks" }]
    },
    {
      filename,
      code: `
        export const useA = () => {};
        export const useB = () => {};
        export const useC = () => {};
        export const useD = () => {};
        export const useE = () => {};
      `,
      options: [{ threshold: 4 }],
      errors: [{ messageId: "tooManyHooks" }]
    },
    {
      filename: "Foo.hooks.ts",
      code: `
        export function useA() {}
        export function useB() {}
        export function useC() {}
      `,
      options: [{ threshold: 2 }],
      errors: [{ messageId: "tooManyHooks" }]
    }
  ]
});
