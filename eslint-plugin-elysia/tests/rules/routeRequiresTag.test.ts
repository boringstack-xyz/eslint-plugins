import {
  RULE_NAME,
  routeRequiresTagRule
} from "../../src/rules/routeRequiresTag";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, routeRequiresTagRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", h, { detail: { tags: ["Users"] } });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.post("/x", h, { detail: { tags: ["Auth", "Internal"] } });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().use(plugin).get("/x", h, { detail: { tags: ["X"] } });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/internal/ping", () => "ok");
      `,
      options: [{ ignorePathPattern: "^/internal/" }]
    },
    {
      code: `
        const app = { get(p: string, h: any, o: any) { return null; } };
        app.get("/x", h, {});
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", h);
      `,
      errors: [{ messageId: "missingTag" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/x", h, { body: {} });
      `,
      errors: [{ messageId: "missingTag" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().patch("/x", h, { detail: { description: "x" } });
      `,
      errors: [{ messageId: "missingTag" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", h, { detail: { tags: [] } });
      `,
      errors: [{ messageId: "missingTag" }]
    }
  ]
});
