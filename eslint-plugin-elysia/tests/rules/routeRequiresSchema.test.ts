import {
  RULE_NAME,
  routeRequiresSchemaRule
} from "../../src/rules/routeRequiresSchema";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, routeRequiresSchemaRule, {
  valid: [
    {
      code: `
        import { Elysia, t } from "elysia";
        new Elysia().post("/x", () => "ok", { body: t.Object({}) });
      `
    },
    {
      code: `
        import { Elysia, t } from "elysia";
        const app = new Elysia();
        app.get("/x", ({ query }) => query, { query: t.Object({}) });
      `
    },
    {
      code: `
        import { Elysia, t } from "elysia";
        new Elysia().use(plugin).patch("/x", h, { params: t.Object({}), response: t.Any() });
      `
    },
    {
      code: `
        import { Elysia, t } from "elysia";
        export const app = new Elysia().get("/x", h, { cookie: t.Object({}) });
      `
    },
    {
      code: `
        const app = { get(p: string, h: any) { return null; } };
        app.get("/x", () => "ok");
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/health", () => "ok");
      `,
      options: [{ allowMethods: ["get"] }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/internal/ping", () => "ok");
      `,
      options: [{ ignorePathPattern: "^/internal/" }]
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => "ok");
      `,
      errors: [
        {
          messageId: "missingSchema",
          data: { method: "GET", path: "/x", keys: "body/query/params/response/headers/cookie" }
        }
      ]
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.post("/x", h, {});
      `,
      errors: [{ messageId: "missingSchema" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().use(plugin).delete("/items/:id", h);
      `,
      errors: [{ messageId: "missingSchema" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().ws("/chat", { open: () => {} });
      `,
      errors: [{ messageId: "missingSchema" }]
    }
  ]
});
