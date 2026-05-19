import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { pkceRequiredForOidcRule } from "./rules/pkce-required-for-oidc";
import { stateMustBeRedisBackedRule } from "./rules/state-must-be-redis-backed";
import { stateTtlBoundedRule } from "./rules/state-ttl-bounded";

type OauthSecurityPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: OauthSecurityPlugin = {
  meta: {
    name: "eslint-plugin-oauth-security",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "oauth-security": plugin
  },
  rules: recommendedRules
};

export {
  stateMustBeRedisBackedRule,
  pkceRequiredForOidcRule,
  stateTtlBoundedRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
