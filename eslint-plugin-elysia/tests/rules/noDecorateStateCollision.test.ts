import {
  RULE_NAME,
  noDecorateStateCollisionRule
} from "../../src/rules/noDecorateStateCollision";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDecorateStateCollisionRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        export const dbPlugin = new Elysia({ name: "db" })
          .decorate("db", {})
          .state("requestId", "");
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        export const userPlugin = new Elysia({ name: "user" })
          .decorate({ a: 1, b: 2 })
          .state({ c: 3 });
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        const a = new Elysia().decorate("x", 1);
        const b = new Elysia().decorate("x", 2);
      `
    },
    {
      code: `
        const bus = { decorate(_k: string, _v: unknown) { return bus; } };
        bus.decorate("x", 1).decorate("x", 2);
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        export const dbPlugin = new Elysia({ name: "db" })
          .decorate("db", a)
          .decorate("db", b);
      `,
      errors: [
        {
          messageId: "decorateKeyCollision",
          data: { key: "db", previous: "decorate" }
        }
      ]
    },
    {
      code: `
        import { Elysia } from "elysia";
        export const dbPlugin = new Elysia({ name: "db" })
          .decorate({ db: 1, log: 2 })
          .state({ db: 3 });
      `,
      errors: [
        {
          messageId: "decorateKeyCollision",
          data: { key: "db", previous: "decorate" }
        }
      ]
    },
    {
      code: `
        import { Elysia } from "elysia";
        export const plug = new Elysia({ name: "p" })
          .decorate("session", null)
          .derive(() => ({}))
          .resolve(() => ({ session: "x" }));
      `,
      errors: [
        {
          messageId: "decorateKeyCollision",
          data: { key: "session", previous: "decorate" }
        }
      ]
    },
    {
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.decorate("x", 1);
        app.state("x", 2);
      `,
      errors: [
        {
          messageId: "decorateKeyCollision",
          data: { key: "x", previous: "decorate" }
        }
      ]
    }
  ]
});
