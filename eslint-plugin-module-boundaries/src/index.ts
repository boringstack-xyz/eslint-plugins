import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { singleSemanticModuleRule } from "./rules/singleSemanticModule";

type ModuleBoundariesPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: ModuleBoundariesPlugin = {
  meta: {
    name: "eslint-plugin-module-boundaries",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "module-boundaries": plugin
  },
  rules: recommendedRules
};

export { singleSemanticModuleRule };
export { rules };
export const configs = plugin.configs;
export default plugin;
