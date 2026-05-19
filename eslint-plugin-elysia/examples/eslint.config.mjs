import tsParser from "@typescript-eslint/parser";
import elysia from "eslint-plugin-elysia";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      elysia
    },
    rules: elysia.configs.recommended.rules
  }
];
