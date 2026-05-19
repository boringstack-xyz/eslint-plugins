import {
  RULE_NAME,
  preferThrowStatusRule
} from "../../src/rules/preferThrowStatus";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, preferThrowStatusRule, {
  valid: [
    {
      code: `
        import { Elysia, status } from "elysia";
        new Elysia().get("/x", () => {
          if (!isOk()) throw status(400, "bad");
          return ok();
        });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", async ({ body }) => {
          try {
            await audit(body);
          } catch (error) {
            logger.warn(error);
          }
          return computeResult(body);
        });
      `
    },
    {
      code: `
        export function notInRoute() {
          try {
            return new Response("ok", { status: 200 });
          } catch {
            return null;
          }
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => {
          try {
            return doStuff();
          } catch (e) {
            return new Response("err", { status: 500 });
          }
        });
      `,
      errors: [{ messageId: "preferThrowStatus" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/users", ({ body, set }) => {
          try {
            return service.create(body);
          } catch (e) {
            set.status = 400;
            return { error: "bad" };
          }
        });
      `,
      errors: [{ messageId: "preferThrowStatus" }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", () => {
          try {
            const a = step1();
            const b = step2();
            const c = step3(a, b);
            const d = step4(c);
            return d;
          } catch (e) {
            return null;
          }
        });
      `,
      errors: [{ messageId: "preferThrowStatus" }]
    }
  ]
});
