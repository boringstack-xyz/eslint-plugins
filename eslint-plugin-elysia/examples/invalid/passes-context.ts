import { Elysia, t } from "elysia";

declare const controller: { create(ctx: unknown): unknown };

export const app = new Elysia({ name: "Ctx" }).post(
  "/users",
  (ctx) => controller.create(ctx),
  { body: t.Object({}), detail: { tags: ["Users"] } }
);
