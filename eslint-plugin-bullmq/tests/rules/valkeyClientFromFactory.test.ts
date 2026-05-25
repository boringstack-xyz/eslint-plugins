import {
  RULE_NAME,
  valkeyClientFromFactoryRule,
} from "../../src/rules/valkeyClientFromFactory";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, valkeyClientFromFactoryRule, {
  valid: [
    {
      filename: "src/lib/cache/providers/valkey.ts",
      code: `
        import { Redis } from "ioredis";
        import { getValkeyAppClientOptions } from "@/clients/valkey";
        new Redis(getValkeyAppClientOptions());
      `,
    },
    {
      filename: "src/lib/notifications/pubsub/valkey-pubsub.ts",
      code: `
        import { Redis } from "ioredis";
        import { getValkeyConnectionOptions } from "@/clients/valkey";
        new Redis(getValkeyConnectionOptions());
      `,
    },
    {
      filename: "tests/clients/valkey/valkey.utils.test.ts",
      code: `import { Redis } from "ioredis"; new Redis({ host: "localhost" });`,
    },
  ],
  invalid: [
    {
      filename: "src/lib/oauth/oauth.state.ts",
      code: `
        import { Redis } from "ioredis";
        new Redis({ host: "localhost", port: 6379 });
      `,
      errors: [{ messageId: "directRedis" }],
    },
  ],
});
