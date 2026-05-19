import {
  RULE_NAME,
  routeMustCheckAbilityRule
} from "../../src/rules/routeMustCheckAbility";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, routeMustCheckAbilityRule, {
  valid: [
    {
      name: "route that doesn't destructure membership is fine",
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", ({ user }) => user.id, { detail: { tags: ["X"] } });
      `
    },
    {
      name: "route reads membership.role — explicit role check",
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", ({ membership }) => {
          if (membership.role !== "owner") throw new Error("nope");
          return "ok";
        }, { detail: { tags: ["X"] } });
      `
    },
    {
      name: "route calls requireAbility(...)",
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", ({ membership }) => {
          requireAbility(buildAbility(membership), "read", "Widget");
          return "ok";
        }, { detail: { tags: ["X"] } });
      `
    },
    {
      name: "route calls enforceLimit(...)",
      code: `
        import { Elysia } from "elysia";
        new Elysia().post("/x", ({ membership }) => {
          enforceLimit("max_widgets", 3, 5);
          return "ok";
        }, { detail: { tags: ["X"] } });
      `
    }
  ],
  invalid: [
    {
      name: "route destructures membership but never checks it",
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", ({ membership }) => {
          return membership.accountId;
        }, { detail: { tags: ["X"] } });
      `,
      errors: [{ messageId: "missingCheck" }]
    },
    {
      name: "route destructures membership but only reads accountId, no role / authz",
      code: `
        import { Elysia } from "elysia";
        const app = new Elysia();
        app.post("/items", async ({ membership, body }) => {
          await db.insert(items).values({ ...body, accountId: membership.accountId });
          return { ok: true };
        }, { detail: { tags: ["Items"] } });
      `,
      errors: [{ messageId: "missingCheck" }]
    },
    {
      name: "renamed param without matching options still flagged",
      code: `
        import { Elysia } from "elysia";
        new Elysia().get("/x", ({ membership: m }) => m.accountId, { detail: { tags: ["X"] } });
      `,
      errors: [{ messageId: "missingCheck" }]
    }
  ]
});
