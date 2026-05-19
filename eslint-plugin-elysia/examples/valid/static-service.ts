import { Elysia } from "elysia";

abstract class UserService {
  static list() {
    return [];
  }
}

export const app = new Elysia({ name: "Users.S" })
  .get("/users", () => UserService.list(), {
    detail: { tags: ["Users"] }
  });
