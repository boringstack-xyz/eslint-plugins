import {
  RULE_NAME,
  cacheSetMustHaveTtlRule
} from "../../src/rules/cache-set-must-have-ttl";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, cacheSetMustHaveTtlRule, {
  valid: [
    {
      code: `cacheService.set("cache:user:1", value, { ttlSeconds: 60 });`
    },
    {
      code: `cache.set("cache:x", value, { ttlSeconds: 30, foo: "bar" });`
    },
    {
      // Spread of external options — permissive.
      code: `cacheService.set("cache:x", value, { ...defaultOpts });`
    },
    {
      // this.cacheService — receiver chain still resolves.
      code: `this.cacheService.set("cache:x", value, { ttlSeconds: 60 });`
    },
    {
      // Unrelated identifier.
      code: `myMap.set("k", value);`
    }
  ],
  invalid: [
    {
      code: `cacheService.set("cache:user:1", value);`,
      errors: [{ messageId: "missingTtl" }]
    },
    {
      code: `cache.set("cache:x", value, {});`,
      errors: [{ messageId: "missingTtl" }]
    },
    {
      code: `cacheService.set("cache:x", value, { foo: "bar" });`,
      errors: [{ messageId: "missingTtl" }]
    },
    {
      code: `this.cacheService.set("cache:x", value, { foo: 1 });`,
      errors: [{ messageId: "missingTtl" }]
    }
  ]
});
