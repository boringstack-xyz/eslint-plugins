import {
  RULE_NAME,
  consistentStatusViaSetRule
} from "../../src/rules/consistentStatusViaSet";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, consistentStatusViaSetRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", ({ set }) => {
          set.status = 404;
          return { error: "not found" };
        });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/x", ({ body, set }) => {
          set.status = 201;
          return body;
        });
      `
    },
    {
      code: `
        export function notInRoute() {
          return new Response("ok", { status: 200 });
        }
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => new Response("ok"));
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => {
          return new Response("nope", { status: 404 });
        });
      `,
      errors: [{ messageId: "useSetStatus" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.post("/x", () => {
          return new Response(JSON.stringify({}), { status: 400 });
        });
      `,
      errors: [{ messageId: "useSetStatus" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().use(plugin).delete("/x", () => {
          return new Response(null, { status: 204 });
        });
      `,
      errors: [{ messageId: "useSetStatus" }]
    }
  ]
});
