import {
  RULE_NAME,
  requirePluginNameRule
} from "../../src/rules/requirePluginName";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requirePluginNameRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        export default new Elysia({ name: "Auth.Plugin" });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        export const dbPlugin = new Elysia({ name: "Db.Plugin" }).decorate("db", {});
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        const localApp = new Elysia();
        localApp.listen(3000);
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        export default new Elysia();
      `,
      options: [{ allowAnonymousDefault: true }]
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        export default new Elysia();
      `,
      errors: [{ messageId: "missingPluginName" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        export const auth = new Elysia();
      `,
      errors: [{ messageId: "missingPluginName" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        export const db = new Elysia().decorate("db", {});
      `,
      errors: [{ messageId: "missingPluginName" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        export default new Elysia({}).use(other).get("/x", h);
      `,
      errors: [{ messageId: "missingPluginName" }]
    }
  ]
});
