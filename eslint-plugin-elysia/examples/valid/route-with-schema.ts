import { Elysia, t } from "elysia";

export const app = new Elysia({ name: "Users.Plugin" })
  .post(
    "/users",
    ({ body, set }) => {
      set.status = 201;
      return body;
    },
    {
      body: t.Object({ email: t.String() }),
      response: t.Object({ email: t.String() }),
      detail: { tags: ["Users"] }
    }
  );
