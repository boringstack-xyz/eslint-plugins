import {
  RULE_NAME,
  preferDirectReturnRule
} from "../../src/rules/preferDirectReturn";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, preferDirectReturnRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => "ok");
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => ({ ok: true }));
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/csv", () => new Response(buildCsv(), { headers: { "content-type": "text/csv" } }));
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/stream", () => new Response(stream));
      `
    },
    {
      code: `
        export function notInRoute() {
          return new Response("ok");
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => new Response("ok"));
      `,
      errors: [{ messageId: "preferDirectReturn" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => Response.json({ ok: true }));
      `,
      errors: [{ messageId: "preferDirectReturn" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/x", () => {
          return new Response(JSON.stringify({ ok: true }));
        });
      `,
      errors: [{ messageId: "preferDirectReturn" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => new Response("ok", { headers: { "x-trace": "1" } }));
      `,
      options: [{ allowWithHeaders: false }],
      errors: [{ messageId: "preferDirectReturn" }]
    }
  ]
});
