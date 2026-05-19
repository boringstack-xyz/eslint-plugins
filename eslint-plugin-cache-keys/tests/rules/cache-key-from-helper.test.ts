import {
  RULE_NAME,
  cacheKeyFromHelperRule
} from "../../src/rules/cache-key-from-helper";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, cacheKeyFromHelperRule, {
  valid: [
    {
      // No helperNames configured — rule no-ops by design.
      code: `cacheService.set("foo", value);`
    },
    {
      // Helper call result — accepted.
      options: [{ helperNames: ["stripeEventCacheKey", "userCacheKey"] }],
      code: `cacheService.get(stripeEventCacheKey(eventId));`
    },
    {
      options: [{ helperNames: ["userCacheKey"] }],
      code: `cacheService.set(userCacheKey(id), value, { ttlSeconds: 60 });`
    },
    {
      // Member-style helper call.
      options: [{ helperNames: ["userCacheKey"] }],
      code: `cacheService.get(keys.userCacheKey(id));`
    }
  ],
  invalid: [
    {
      options: [{ helperNames: ["stripeEventCacheKey"] }],
      code: `cacheService.get("stripe:event:evt_1");`,
      errors: [{ messageId: "keyNotFromHelper" }]
    },
    {
      options: [{ helperNames: ["userCacheKey"] }],
      code: 'cacheService.set(`cache:user:${id}`, value, { ttlSeconds: 60 });',
      errors: [{ messageId: "keyNotFromHelper" }]
    },
    {
      options: [{ helperNames: ["userCacheKey"] }],
      code: `cacheService.get(otherHelper(id));`,
      errors: [{ messageId: "keyNotFromHelper" }]
    }
  ]
});
