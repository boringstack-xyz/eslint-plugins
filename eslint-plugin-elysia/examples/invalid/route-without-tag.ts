import { Elysia, t } from "elysia";

export const app = new Elysia({ name: "NoTag" }).get("/users", () => [], {
  response: t.Array(t.Object({}))
});
