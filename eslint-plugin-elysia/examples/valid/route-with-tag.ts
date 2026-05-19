import { Elysia, t } from "elysia";

export const app = new Elysia({ name: "Tagged" })
  .get(
    "/users",
    () => [],
    {
      response: t.Array(t.Object({})),
      detail: { tags: ["Users"], summary: "List users" }
    }
  );
