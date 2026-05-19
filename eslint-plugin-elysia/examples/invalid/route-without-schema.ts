import { Elysia } from "elysia";

export const app = new Elysia({ name: "NoSchema" }).post("/users", () => "ok");
