import {
  RULE_NAME,
  stateTtlBoundedRule
} from "../../src/rules/state-ttl-bounded";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, stateTtlBoundedRule, {
  valid: [
    {
      // Not a state file — rule no-ops.
      filename: "src/users/users.service.ts",
      code: `redis.setex("k", 99999, "v");`
    },
    {
      filename: "src/oauth/state.ts",
      code: `redis.setex("oauth:state:x", 600, "1");`
    },
    {
      filename: "src/oauth/state.ts",
      code: `
        const TTL = 300;
        redis.setex("oauth:state:x", TTL, "1");
      `
    },
    {
      filename: "src/oauth/state.ts",
      code: `redis.set("oauth:state:x", "1", "EX", 300);`
    },
    {
      filename: "src/oauth/state.ts",
      code: `redis.set("oauth:state:x", "1", { EX: 300 });`
    },
    {
      // Identifier from elsewhere — skipped (best-effort).
      filename: "src/oauth/state.ts",
      code: `
        function f(ttl: number) { redis.setex("k", ttl, "v"); }
      `
    }
  ],
  invalid: [
    {
      filename: "src/oauth/state.ts",
      code: `redis.setex("oauth:state:x", 3600, "1");`,
      errors: [{ messageId: "stateTtlTooLong" }]
    },
    {
      filename: "src/oauth/state.ts",
      code: `
        const TTL = 7200;
        redis.setex("oauth:state:x", TTL, "1");
      `,
      errors: [{ messageId: "stateTtlTooLong" }]
    },
    {
      filename: "src/oauth/state.ts",
      code: `redis.set("oauth:state:x", "1", "EX", 3600);`,
      errors: [{ messageId: "stateTtlTooLong" }]
    },
    {
      filename: "src/oauth/state.ts",
      code: `redis.set("oauth:state:x", "1", { EX: 86400 });`,
      errors: [{ messageId: "stateTtlTooLong" }]
    }
  ]
});
