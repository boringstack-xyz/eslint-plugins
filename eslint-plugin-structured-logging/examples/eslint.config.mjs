import tsParser from "@typescript-eslint/parser";
import structuredLogging from "eslint-plugin-structured-logging";

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
      "structured-logging": structuredLogging
    },
    rules: {
      "structured-logging/require-event-field": "error",
      "structured-logging/mask-pii-fields": "error",
      "structured-logging/no-error-stringify": "error"
    }
  }
];
