import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { cacheKeyFromHelperRule } from "./rules/cache-key-from-helper";
import { cacheKeyMustBePrefixedRule } from "./rules/cache-key-must-be-prefixed";
import { cacheSetMustHaveTtlRule } from "./rules/cache-set-must-have-ttl";

type CacheKeysPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: CacheKeysPlugin = {
  meta: {
    name: "eslint-plugin-cache-keys",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "cache-keys": plugin
  },
  rules: recommendedRules
};

export {
  cacheSetMustHaveTtlRule,
  cacheKeyMustBePrefixedRule,
  cacheKeyFromHelperRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
