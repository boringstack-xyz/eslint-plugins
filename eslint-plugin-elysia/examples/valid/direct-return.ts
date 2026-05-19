import { Elysia, t } from "elysia";

export const app = new Elysia({ name: "Direct" })
  .get("/json", () => ({ ok: true }), {
    response: t.Object({ ok: t.Boolean() }),
    detail: { tags: ["System"] }
  })
  .get("/csv", () => new Response("col1,col2", { headers: { "content-type": "text/csv" } }), {
    detail: { tags: ["Reports"] }
  });
