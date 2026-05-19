import { classnamesImportNameRule } from "./classnamesImportName";
import { classnamesRequiredRule } from "./classnamesRequired";
import { componentFolderStructureRule } from "./componentFolderStructure";
import { forwardrefDisplayNameRule } from "./forwardrefDisplayName";
import { githubActionsPermissionsRule } from "./githubActionsPermissions";
import { indexMustReexportDefaultRule } from "./indexMustReexportDefault";
import { interfacePrefixIRule } from "./interfacePrefixI";
import { maxHooksPerFileRule } from "./maxHooksPerFile";
import { noCrossFeatureImportsRule } from "./noCrossFeatureImports";
import { noDarkModeClassesRule } from "./noDarkModeClasses";
import { noInlineJsxFunctionsRule } from "./noInlineJsxFunctions";
import { noJsxComputationRule } from "./noJsxComputation";
import { noStateInComponentBodyRule } from "./noStateInComponentBody";
import { noUntranslatedJsxTextRule } from "./noUntranslatedJsxText";
import { packageJsonExactDepsRule } from "./packageJsonExactDeps";
import { propsMustBeVisualRule } from "./propsMustBeVisual";
import { queryKeysMustBeConstantRule } from "./queryKeysMustBeConstant";
import { reactImportNamedRule } from "./reactImportNamed";
import { storiesRequireDefaultExportRule } from "./storiesRequireDefaultExport";

export const rules = {
  "component-folder-structure": componentFolderStructureRule,
  "index-must-reexport-default": indexMustReexportDefaultRule,
  "no-state-in-component-body": noStateInComponentBodyRule,
  "no-inline-jsx-functions": noInlineJsxFunctionsRule,
  "no-jsx-computation": noJsxComputationRule,
  "classnames-required": classnamesRequiredRule,
  "classnames-import-name": classnamesImportNameRule,
  "no-dark-mode-classes": noDarkModeClassesRule,
  "interface-prefix-i": interfacePrefixIRule,
  "forwardref-display-name": forwardrefDisplayNameRule,
  "stories-require-default-export": storiesRequireDefaultExportRule,
  "props-must-be-visual": propsMustBeVisualRule,
  "react-import-named": reactImportNamedRule,
  "package-json-exact-deps": packageJsonExactDepsRule,
  "github-actions-permissions": githubActionsPermissionsRule,
  "no-untranslated-jsx-text": noUntranslatedJsxTextRule,
  "query-keys-must-be-constant": queryKeysMustBeConstantRule,
  "no-cross-feature-imports": noCrossFeatureImportsRule,
  "max-hooks-per-file": maxHooksPerFileRule
};
