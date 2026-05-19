import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { accountScopedTablesRequireWhereRule } from "./rules/accountScopedTablesRequireWhere";
import { noNestedDbTransactionRule } from "./rules/noNestedDbTransaction";
import { noRawSqlOutsideAllowlistRule } from "./rules/noRawSqlOutsideAllowlist";
import { relationsMustCoverFksRule } from "./rules/relationsMustCoverFks";
import { schemaFilesMustNotImportDriverRule } from "./rules/schemaFilesMustNotImportDriver";
import { schemaFilesMustOnlyExportSchemaRule } from "./rules/schemaFilesMustOnlyExportSchema";
import { tablesMustHaveTimestampsRule } from "./rules/tablesMustHaveTimestamps";
import { timestampMustSpecifyModeRule } from "./rules/timestampMustSpecifyMode";

type DrizzleConventionsPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: DrizzleConventionsPlugin = {
  meta: {
    name: "eslint-plugin-drizzle-conventions",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "drizzle-conventions": plugin
  },
  rules: recommendedRules
};

export {
  accountScopedTablesRequireWhereRule,
  noNestedDbTransactionRule,
  noRawSqlOutsideAllowlistRule,
  relationsMustCoverFksRule,
  schemaFilesMustNotImportDriverRule,
  schemaFilesMustOnlyExportSchemaRule,
  tablesMustHaveTimestampsRule,
  timestampMustSpecifyModeRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
