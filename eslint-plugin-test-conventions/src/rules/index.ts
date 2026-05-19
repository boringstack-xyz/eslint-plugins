import { noDirectDbInTestsRule } from "./no-direct-db-in-tests";
import { noFocusedTestsRule } from "./no-focused-tests";
import { testFileMirrorsSourceRule } from "./test-file-mirrors-source";

export const rules = {
  "no-focused-tests": noFocusedTestsRule,
  "no-direct-db-in-tests": noDirectDbInTestsRule,
  "test-file-mirrors-source": testFileMirrorsSourceRule
};
