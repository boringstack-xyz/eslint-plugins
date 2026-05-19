import { RULE_NAME, serviceMustExportSingletonRule } from "../../src/rules/serviceMustExportSingleton";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, serviceMustExportSingletonRule, {
  valid: [
    // Class + singleton — canonical pattern
    {
      filename: "src/lib/users/users.service.ts",
      code: `
        export class UserService {}
        export const userService = new UserService();
      `
    },
    {
      filename: "src/lib/users/users.service.ts",
      code: `
        export default class UserService {}
        export const userService = new UserService();
      `
    },
    // Non-service file — out of scope
    {
      filename: "src/lib/users/not-a-service.ts",
      code: `
        export class UserService {}
      `
    },
    // No class exported — function-namespace service is a valid pattern.
    // Default `requireClass: false` lets these pass.
    {
      filename: "src/lib/email/email.service.ts",
      code: `
        export const sendEmail = async () => { /* ... */ };
        export const sendBatch = async () => { /* ... */ };
      `
    },
    {
      filename: "src/lib/oauth/oauth.service.ts",
      code: `
        export const createAuthorizationURL = async () => { /* ... */ };
        export const completeOAuthCallback = async () => { /* ... */ };
      `
    },
    // Empty service file — function-namespace style with no exports
    {
      filename: "src/lib/empty.service.ts",
      code: `
        // intentional placeholder
      `
    }
  ],
  invalid: [
    // Class exported, no singleton
    {
      filename: "src/lib/users/users.service.ts",
      code: `
        export class UserService {}
      `,
      errors: [
        {
          messageId: "missingSingleton",
          data: { class: "UserService", singleton: "userService" }
        }
      ]
    },
    // Singleton instantiates a non-exported class — under default
    // (requireClass: false) this is valid, but under requireClass:true
    // it must error because no class is exported in this file.
    {
      filename: "src/lib/users/users.service.ts",
      code: `
        export const userService = new UserService();
      `,
      options: [{ requireClass: true }],
      errors: [{ messageId: "missingClass" }]
    },
    // Class exported, singleton declared but not exported
    {
      filename: "src/lib/users/users.service.ts",
      code: `
        export class UserService {}
        const userService = new UserService();
      `,
      errors: [{ messageId: "missingSingleton" }]
    },
    // requireClass: true + no class → missingClass
    {
      filename: "src/lib/email/email.service.ts",
      code: `
        export const sendEmail = async () => { /* ... */ };
      `,
      options: [{ requireClass: true }],
      errors: [{ messageId: "missingClass" }]
    },
    // requireClass: true + class but no singleton → missingSingleton
    {
      filename: "src/lib/users/users.service.ts",
      code: `
        export class UserService {}
      `,
      options: [{ requireClass: true }],
      errors: [{ messageId: "missingSingleton" }]
    }
  ]
});
