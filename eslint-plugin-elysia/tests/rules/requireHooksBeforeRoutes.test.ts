import {
  RULE_NAME,
  requireHooksBeforeRoutesRule
} from "../../src/rules/requireHooksBeforeRoutes";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireHooksBeforeRoutesRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia()
          .onError(({ error }) => console.error(error))
          .get("/health", () => "ok");
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.onError(handleError);
        app.get("/x", h);
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia()
          .onRequest(audit)
          .onBeforeHandle(auth)
          .get("/health", () => "ok")
          .post("/users", h);
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", h, { beforeHandle: () => null });
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia()
          .get("/health", () => "ok")
          .onError(({ error }) => console.error(error));
      `,
      errors: [{ messageId: "hookAfterRoute", data: { hook: "onError", route: "get" } }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.get("/x", h);
        app.onError(handleError);
      `,
      errors: [{ messageId: "hookAfterRoute", data: { hook: "onError", route: "get" } }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia()
          .post("/users", h)
          .onAfterHandle(audit)
          .onError(handleError);
      `,
      errors: [
        { messageId: "hookAfterRoute", data: { hook: "onAfterHandle", route: "post" } },
        { messageId: "hookAfterRoute", data: { hook: "onError", route: "post" } }
      ]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia()
          .get("/health", () => "ok", { beforeHandle: () => null })
          .onError(handleError);
      `,
      errors: [{ messageId: "hookAfterRoute", data: { hook: "onError", route: "get" } }]
    }
  ]
});
