import tsParser from "@typescript-eslint/parser";
import envAccess from "eslint-plugin-env-access";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "env-access": envAccess
    },
    rules: {
      "env-access/no-direct-process-env": "error",
      "env-access/env-var-must-have-schema-entry": [
        "error",
        {
          singletonImportPath: "@/config/env",
          singletonName: "env",
          schemaFile: "src/config/env/schema.ts"
        }
      ]
    }
  }
];
