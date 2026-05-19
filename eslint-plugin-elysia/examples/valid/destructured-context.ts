import { Elysia, t } from "elysia";

declare const controller: { create(input: { body: unknown }): unknown };

export const app = new Elysia({ name: "Users.V" })
  .post(
    "/users",
    ({ body, set }) => {
      set.status = 201;
      return controller.create({ body });
    },
    { body: t.Object({}), detail: { tags: ["Users"] } }
  );
