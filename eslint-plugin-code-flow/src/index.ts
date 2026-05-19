import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { noTemplateTrimEmptyTernaryRule } from "./rules/noTemplateTrimEmptyTernary";
import { preferEarlyReturnRule } from "./rules/preferEarlyReturn";

type CodeFlowPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: CodeFlowPlugin = {
  meta: {
    name: "eslint-plugin-code-flow",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "code-flow": plugin
  },
  rules: recommendedRules
};

export { noTemplateTrimEmptyTernaryRule };
export { preferEarlyReturnRule };
export { rules };
export const configs = plugin.configs;
export default plugin;
