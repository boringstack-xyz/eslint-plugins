import { Elysia } from "elysia";

export const app = new Elysia({ name: "BadOrder" })
  .get("/health", () => "ok", { detail: { tags: ["System"] } })
  .onError(({ error }) => console.error(error));
