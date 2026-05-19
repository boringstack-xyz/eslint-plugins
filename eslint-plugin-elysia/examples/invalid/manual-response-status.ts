import { Elysia, t } from "elysia";

export const app = new Elysia({ name: "BadStatus" }).get(
  "/users/:id",
  () => new Response("not found", { status: 404 }),
  { params: t.Object({ id: t.String() }), detail: { tags: ["Users"] } }
);
