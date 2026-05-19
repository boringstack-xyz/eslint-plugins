import { Elysia } from "elysia";

export const app = new Elysia({ name: "Wrap" }).get(
  "/users",
  () => Response.json({ ok: true }),
  { detail: { tags: ["Users"] } }
);
