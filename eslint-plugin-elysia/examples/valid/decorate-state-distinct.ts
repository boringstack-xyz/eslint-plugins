import { Elysia } from "elysia";

export const dbPlugin = new Elysia({ name: "Db.Distinct" })
  .decorate("db", {})
  .state("requestId", "")
  .derive(() => ({ now: () => Date.now() }));
