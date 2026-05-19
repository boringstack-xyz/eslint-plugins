import { cacheKeyFromHelperRule } from "./cache-key-from-helper";
import { cacheKeyMustBePrefixedRule } from "./cache-key-must-be-prefixed";
import { cacheSetMustHaveTtlRule } from "./cache-set-must-have-ttl";

export const rules = {
  "cache-set-must-have-ttl": cacheSetMustHaveTtlRule,
  "cache-key-must-be-prefixed": cacheKeyMustBePrefixedRule,
  "cache-key-from-helper": cacheKeyFromHelperRule
};
