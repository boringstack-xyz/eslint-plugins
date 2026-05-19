import {
  RULE_NAME,
  preferStaticServicesRule
} from "../../src/rules/preferStaticServices";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, preferStaticServicesRule, {
  valid: [
    {
      code: `
        import { Elysia } from "elysia";
        class UserService {
          static list() { return []; }
        }
        new Elysia().get("/users", () => UserService.list());
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        class UserService {
          constructor(private db: any) {}
          list() { return this.db.users; }
        }
        new Elysia().get("/users", ({ db }) => new UserService(db).list());
      `
    },
    {
      code: `
        class UserService {
          list() { return []; }
        }
        const x = new UserService();
      `
    },
    {
      code: `
        import { Elysia } from "elysia";
        class HelperUtility {
          run() { return null; }
        }
        new Elysia().get("/x", () => new HelperUtility());
      `
    }
  ],
  invalid: [
    {
      code: `
        import { Elysia } from "elysia";
        class UserService {
          list() { return []; }
        }
        new Elysia().get("/users", () => {
          const service = new UserService();
          return service.list();
        });
      `,
      errors: [{ messageId: "preferStaticService", data: { name: "UserService" } }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        class UserController {
          handle() { return null; }
        }
        new Elysia().post("/users", () => new UserController().handle());
      `,
      errors: [{ messageId: "preferStaticService", data: { name: "UserController" } }]
    },
    {
      code: `
        import { Elysia } from "elysia";
        class JobManager {
          tick() { return Date.now(); }
        }
        const app = new Elysia();
        app.get("/tick", () => new JobManager().tick());
      `,
      errors: [{ messageId: "preferStaticService", data: { name: "JobManager" } }]
    }
  ]
});
