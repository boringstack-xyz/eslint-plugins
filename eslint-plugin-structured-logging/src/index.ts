import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { maskPiiFieldsRule } from "./rules/mask-pii-fields";
import { noErrorStringifyRule } from "./rules/no-error-stringify";
import { requireEventFieldRule } from "./rules/require-event-field";
import { typedEventNamesRule } from "./rules/typed-event-names";

type StructuredLoggingPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: StructuredLoggingPlugin = {
  meta: {
    name: "eslint-plugin-structured-logging",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "structured-logging": plugin
  },
  rules: recommendedRules
};

export {
  requireEventFieldRule,
  maskPiiFieldsRule,
  noErrorStringifyRule,
  typedEventNamesRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
