import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { noDirectDbInTestsRule } from "./rules/no-direct-db-in-tests";
import { noFocusedTestsRule } from "./rules/no-focused-tests";
import {
  setFileExistsForTesting,
  testFileMirrorsSourceRule
} from "./rules/test-file-mirrors-source";

type TestConventionsPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: TestConventionsPlugin = {
  meta: {
    name: "eslint-plugin-test-conventions",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "test-conventions": plugin
  },
  rules: recommendedRules
};

export {
  noFocusedTestsRule,
  noDirectDbInTestsRule,
  testFileMirrorsSourceRule,
  setFileExistsForTesting
};
export { rules };
export const configs = plugin.configs;
export default plugin;
