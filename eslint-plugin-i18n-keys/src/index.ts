import type { TSESLint } from "@typescript-eslint/utils";

import { rules } from "./rules";
import { staticTranslationKeyExistsRule } from "./rules/static-translation-key-exists";

type Plugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: Plugin = {
  meta: { name: "eslint-plugin-i18n-keys", version: "0.1.0" },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: { "i18n-keys": plugin },
  rules: {
    "i18n-keys/static-translation-key-exists": [
      "error",
      { dictionary: "src/lib/i18n/locales/en/common.json" }
    ]
  }
};

export { staticTranslationKeyExistsRule, rules };
export const configs = plugin.configs;
export default plugin;
