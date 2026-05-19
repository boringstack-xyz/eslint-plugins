import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { prefixQueryKeyMustUseSetQueriesDataRule } from "./rules/prefix-query-key-must-use-set-queries-data";

type TanstackQueryCachePlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: TanstackQueryCachePlugin = {
  meta: {
    name: "eslint-plugin-tanstack-query-cache",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "tanstack-query-cache": plugin
  },
  rules: recommendedRules
};

export { prefixQueryKeyMustUseSetQueriesDataRule };
export { rules };
export const configs = plugin.configs;
export default plugin;
