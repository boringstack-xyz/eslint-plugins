import { Elysia } from "elysia";

export const dbPlugin = new Elysia({ name: "DupKey" })
  .decorate("db", {})
  .state("db", {});
