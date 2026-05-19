import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import {
  envVarMustHaveSchemaEntryRule,
  setSchemaReaderForTesting
} from "./rules/env-var-must-have-schema-entry";
import { noDirectProcessEnvRule } from "./rules/no-direct-process-env";

type EnvAccessPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: EnvAccessPlugin = {
  meta: {
    name: "eslint-plugin-env-access",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "env-access": plugin
  },
  rules: recommendedRules
};

export {
  noDirectProcessEnvRule,
  envVarMustHaveSchemaEntryRule,
  setSchemaReaderForTesting
};
export { rules };
export const configs = plugin.configs;
export default plugin;
