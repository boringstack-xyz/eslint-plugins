import { concernImportBoundariesRule } from "./concernImportBoundaries";
import { filesMustBeResourcePrefixedRule } from "./filesMustBeResourcePrefixed";
import { noCrossResourceInternalImportsRule } from "./noCrossResourceInternalImports";
import { pluggableProvidersMustHaveNoopRule } from "./pluggableProvidersMustHaveNoop";
import { serviceMustExportSingletonRule } from "./serviceMustExportSingleton";

export {
  concernImportBoundariesRule,
  filesMustBeResourcePrefixedRule,
  noCrossResourceInternalImportsRule,
  pluggableProvidersMustHaveNoopRule,
  serviceMustExportSingletonRule
};

export const rules = {
  "files-must-be-resource-prefixed": filesMustBeResourcePrefixedRule,
  "service-must-export-singleton": serviceMustExportSingletonRule,
  "pluggable-providers-must-have-noop": pluggableProvidersMustHaveNoopRule,
  "concern-import-boundaries": concernImportBoundariesRule,
  "no-cross-resource-internal-imports": noCrossResourceInternalImportsRule
} as const;
