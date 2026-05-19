// no-direct-db-in-tests: bypasses the helpers entrypoint
import { drizzle } from "drizzle-orm";

describe("users", () => {
  // no-focused-tests: skips every other test in CI
  test.only("focused", () => {});

  // no-focused-tests: bare alias form
  fit("also focused", () => {});
});
