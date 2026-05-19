import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { classnamesImportNameRule } from "./rules/classnamesImportName";
import { classnamesRequiredRule } from "./rules/classnamesRequired";
import { componentFolderStructureRule } from "./rules/componentFolderStructure";
import { forwardrefDisplayNameRule } from "./rules/forwardrefDisplayName";
import { githubActionsPermissionsRule } from "./rules/githubActionsPermissions";
import { indexMustReexportDefaultRule } from "./rules/indexMustReexportDefault";
import { interfacePrefixIRule } from "./rules/interfacePrefixI";
import { maxHooksPerFileRule } from "./rules/maxHooksPerFile";
import { noDarkModeClassesRule } from "./rules/noDarkModeClasses";
import { noInlineJsxFunctionsRule } from "./rules/noInlineJsxFunctions";
import { noJsxComputationRule } from "./rules/noJsxComputation";
import { noStateInComponentBodyRule } from "./rules/noStateInComponentBody";
import { packageJsonExactDepsRule } from "./rules/packageJsonExactDeps";
import { propsMustBeVisualRule } from "./rules/propsMustBeVisual";
import { reactImportNamedRule } from "./rules/reactImportNamed";
import { storiesRequireDefaultExportRule } from "./rules/storiesRequireDefaultExport";

type ReactComponentArchitecturePlugin =
  TSESLint.FlatConfig.Plugin & {
    configs: Record<string, TSESLint.FlatConfig.Config>;
  };

const plugin: ReactComponentArchitecturePlugin = {
  meta: {
    name: "eslint-plugin-react-component-architecture",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "react-component-architecture": plugin
  },
  rules: recommendedRules
};

export {
  classnamesImportNameRule,
  classnamesRequiredRule,
  componentFolderStructureRule,
  forwardrefDisplayNameRule,
  githubActionsPermissionsRule,
  indexMustReexportDefaultRule,
  interfacePrefixIRule,
  maxHooksPerFileRule,
  noDarkModeClassesRule,
  noInlineJsxFunctionsRule,
  noJsxComputationRule,
  noStateInComponentBodyRule,
  packageJsonExactDepsRule,
  propsMustBeVisualRule,
  reactImportNamedRule,
  storiesRequireDefaultExportRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
