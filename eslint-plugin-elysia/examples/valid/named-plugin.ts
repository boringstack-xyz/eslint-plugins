import { Elysia } from "elysia";

export const dbPlugin = new Elysia({ name: "Db.Plugin" }).decorate("db", {});
export default new Elysia({ name: "Auth.Plugin" });
