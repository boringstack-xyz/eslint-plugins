import {
  RULE_NAME,
  preferDestructuredContextRule
} from "../../src/rules/preferDestructuredContext";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, preferDestructuredContextRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/users", ({ body, set }) => createUser({ body }));
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", (ctx) => ctx.body);
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", (ctx) => ({ body: ctx.body, query: ctx.query }));
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", (request) => loadByRequest(request));
      `,
      options: [{ allowNames: ["request"] }]
    },
    {
      code: `
        function externalHandler(ctx: any) { return service.list(ctx); }
        externalHandler({});
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/users", (ctx) => controller.list(ctx));
      `,
      errors: [{ messageId: "preferDestructuredContext", data: { name: "ctx" } }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/users", async function (context) {
          return service.create(context);
        });
      `,
      errors: [{ messageId: "preferDestructuredContext", data: { name: "context" } }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.get("/x", (c) => helpers.something(c, "extra"));
      `,
      errors: [{ messageId: "preferDestructuredContext", data: { name: "c" } }]
    }
  ]
});
