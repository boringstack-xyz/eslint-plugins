import { accountScopedTablesRequireWhereRule } from "./accountScopedTablesRequireWhere";
import { noNestedDbTransactionRule } from "./noNestedDbTransaction";
import { noRawSqlOutsideAllowlistRule } from "./noRawSqlOutsideAllowlist";
import { relationsMustCoverFksRule } from "./relationsMustCoverFks";
import { schemaFilesMustNotImportDriverRule } from "./schemaFilesMustNotImportDriver";
import { schemaFilesMustOnlyExportSchemaRule } from "./schemaFilesMustOnlyExportSchema";
import { tablesMustHaveTimestampsRule } from "./tablesMustHaveTimestamps";
import { timestampMustSpecifyModeRule } from "./timestampMustSpecifyMode";

export const rules = {
  "tables-must-have-timestamps": tablesMustHaveTimestampsRule,
  "timestamp-must-specify-mode": timestampMustSpecifyModeRule,
  "relations-must-cover-fks": relationsMustCoverFksRule,
  "no-raw-sql-outside-allowlist": noRawSqlOutsideAllowlistRule,
  "no-nested-db-transaction": noNestedDbTransactionRule,
  "schema-files-must-only-export-schema": schemaFilesMustOnlyExportSchemaRule,
  "schema-files-must-not-import-driver": schemaFilesMustNotImportDriverRule,
  "account-scoped-tables-require-where": accountScopedTablesRequireWhereRule
};
