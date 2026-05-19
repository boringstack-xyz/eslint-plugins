import {
  RULE_NAME,
  cacheKeyMustBePrefixedRule
} from "../../src/rules/cache-key-must-be-prefixed";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, cacheKeyMustBePrefixedRule, {
  valid: [
    {
      code: `cacheService.get("cache:user:1");`
    },
    {
      code: `cache.set("stripe:event:evt_123", value, { ttlSeconds: 60 });`
    },
    {
      // Template literal with prefix in first quasi.
      code: 'cacheService.get(`cache:user:${id}`);'
    },
    {
      // Identifier — assumed to be a built key.
      code: `cacheService.get(builtKey);`
    },
    {
      // Helper call result — also accepted.
      code: `cacheService.get(stripeEventCacheKey(eventId));`
    },
    {
      // Custom prefixes via options.
      code: `cacheService.get("custom:x");`,
      options: [{ prefixes: ["custom:"] }]
    }
  ],
  invalid: [
    {
      code: `cacheService.get("user:1");`,
      errors: [{ messageId: "missingKeyPrefix" }]
    },
    {
      code: `cache.del("foo");`,
      errors: [{ messageId: "missingKeyPrefix" }]
    },
    {
      code: 'cacheService.set(`user:${id}`, value, { ttlSeconds: 60 });',
      errors: [{ messageId: "missingKeyPrefix" }]
    },
    {
      code: `cache.has("plain-key");`,
      errors: [{ messageId: "missingKeyPrefix" }]
    }
  ]
});
