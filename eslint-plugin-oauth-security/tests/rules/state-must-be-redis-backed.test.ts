import {
  RULE_NAME,
  stateMustBeRedisBackedRule
} from "../../src/rules/state-must-be-redis-backed";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, stateMustBeRedisBackedRule, {
  valid: [
    {
      // Not a state file — rule no-ops.
      filename: "src/users/users.service.ts",
      code: `function f() { return 1; }`
    },
    {
      filename: "src/oauth/state.ts",
      code: `
        import { redis } from "./redis";
        export async function storeState(state: string) {
          await redis.setex("oauth:state:" + state, 600, "1");
        }
      `
    },
    {
      filename: "src/oauth/oauth.state.ts",
      code: `
        import { redisClient } from "./client";
        export async function storeState(state: string) {
          await redisClient.set("oauth:state:" + state, "1", "EX", 600);
        }
      `
    },
    {
      // Lazy-accessor pattern — `getClient()` returns a Redis client.
      filename: "src/oauth/state.ts",
      code: `
        function getClient() { return null; }
        export async function storeState(state: string) {
          await getClient().setex("oauth:state:" + state, 600, "1");
        }
      `
    }
  ],
  invalid: [
    {
      filename: "src/oauth/state.ts",
      code: `
        export async function storeState(state: string) {
          return state.length;
        }
      `,
      errors: [{ messageId: "missingRedisWrite" }]
    },
    {
      filename: "src/oauth/state.ts",
      code: `
        export async function storeState(state: string) {
          cookieJar.set("state", state);
        }
      `,
      errors: [
        { messageId: "missingRedisWrite" },
        { messageId: "stateInCookie" }
      ]
    },
    {
      filename: "src/oauth/state.ts",
      code: `
        export async function storeState(state: string) {
          reply.setCookie("oauth_state", state);
        }
      `,
      errors: [
        { messageId: "missingRedisWrite" },
        { messageId: "stateInCookie" }
      ]
    }
  ]
});
