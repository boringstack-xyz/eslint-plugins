import { Elysia, t } from "elysia";

export const app = new Elysia({ name: "Status" })
  .get(
    "/users/:id",
    ({ set }) => {
      set.status = 404;
      return { error: "not found" };
    },
    { params: t.Object({ id: t.String() }), detail: { tags: ["Users"] } }
  );
