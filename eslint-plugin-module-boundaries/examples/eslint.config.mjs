import tsParser from "@typescript-eslint/parser";
import moduleBoundaries from "eslint-plugin-module-boundaries";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "module-boundaries": moduleBoundaries
    },
    rules: {
      "module-boundaries/single-semantic-module": [
        "error",
        {
          allow: [["type", "schema"]],
          enumCategory: "enum"
        }
      ]
    }
  }
];
