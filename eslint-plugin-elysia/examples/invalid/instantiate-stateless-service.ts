import { Elysia, t } from "elysia";

class UserService {
  list() {
    return [];
  }
}

export const app = new Elysia({ name: "Stateless" }).get(
  "/users",
  () => new UserService().list(),
  { response: t.Array(t.Object({})), detail: { tags: ["Users"] } }
);
