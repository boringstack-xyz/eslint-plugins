import { withDb } from "../helpers/db";

describe("users", () => {
  test("creates a user", async () => {
    await withDb(async () => {
      // ...
    });
  });

  test.skip("flaky", () => {});
});
