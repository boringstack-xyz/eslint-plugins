import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { authCookieMustBeHttpOnlyRule } from "./rules/auth-cookie-must-be-httponly";
import { authCookieMustBeSecureInProdRule } from "./rules/auth-cookie-must-be-secure-in-prod";
import { bcryptRoundsMinRule } from "./rules/bcrypt-rounds-min";

type JwtCookiesPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: JwtCookiesPlugin = {
  meta: {
    name: "eslint-plugin-jwt-cookies",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "jwt-cookies": plugin
  },
  rules: recommendedRules
};

export {
  authCookieMustBeHttpOnlyRule,
  authCookieMustBeSecureInProdRule,
  bcryptRoundsMinRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
