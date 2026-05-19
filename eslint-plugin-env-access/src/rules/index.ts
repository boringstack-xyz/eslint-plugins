import { envVarMustHaveSchemaEntryRule } from "./env-var-must-have-schema-entry";
import { noDirectProcessEnvRule } from "./no-direct-process-env";

export const rules = {
  "no-direct-process-env": noDirectProcessEnvRule,
  "env-var-must-have-schema-entry": envVarMustHaveSchemaEntryRule
};
