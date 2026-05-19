import { Elysia, status, t } from "elysia";

declare function loadUser(id: string): { id: string } | null;

export const app = new Elysia({ name: "Throw" })
  .get(
    "/users/:id",
    ({ params }) => {
      const user = loadUser(params.id);
      if (!user) throw status(404, "not found");
      return user;
    },
    { params: t.Object({ id: t.String() }), detail: { tags: ["Users"] } }
  );
