import tsParser from "@typescript-eslint/parser";
import resourceArchitecture from "eslint-plugin-resource-architecture";

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
    ...resourceArchitecture.configs.recommended
  }
];

