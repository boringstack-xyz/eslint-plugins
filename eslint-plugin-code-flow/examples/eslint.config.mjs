import tsParser from "@typescript-eslint/parser";
import codeFlow from "eslint-plugin-code-flow";

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
      "code-flow": codeFlow
    },
    rules: {
      "code-flow/prefer-early-return": "error"
    }
  }
];
