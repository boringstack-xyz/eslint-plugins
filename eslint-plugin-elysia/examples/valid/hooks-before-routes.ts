import { Elysia } from "elysia";

export const app = new Elysia({ name: "App" })
  .onError(({ error }) => console.error(error))
  .onBeforeHandle(({ headers }) => requireAuth(headers))
  .get("/health", () => "ok", { detail: { tags: ["System"] } });

function requireAuth(_headers: unknown) {
  return null;
}
