import { Elysia, t } from "elysia";

declare function loadUser(id: string): { id: string };

export const app = new Elysia({ name: "BadCatch" }).get(
  "/users/:id",
  ({ params }) => {
    try {
      return loadUser(params.id);
    } catch (e) {
      return new Response("not found", { status: 404 });
    }
  },
  { params: t.Object({ id: t.String() }), detail: { tags: ["Users"] } }
);
