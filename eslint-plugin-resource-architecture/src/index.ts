import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { filesMustBeResourcePrefixedRule } from "./rules/filesMustBeResourcePrefixed";
import { serviceMustExportSingletonRule } from "./rules/serviceMustExportSingleton";
import { pluggableProvidersMustHaveNoopRule } from "./rules/pluggableProvidersMustHaveNoop";
import { concernImportBoundariesRule } from "./rules/concernImportBoundaries";
import { noCrossResourceInternalImportsRule } from "./rules/noCrossResourceInternalImports";

type ResourceArchitecturePlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: ResourceArchitecturePlugin = {
  meta: {
    name: "eslint-plugin-resource-architecture",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "resource-architecture": plugin
  },
  rules: recommendedRules
};

export { rules };
export const configs = plugin.configs;

export { filesMustBeResourcePrefixedRule };
export { serviceMustExportSingletonRule };
export { pluggableProvidersMustHaveNoopRule };
export { concernImportBoundariesRule };
export { noCrossResourceInternalImportsRule };

export default plugin;

