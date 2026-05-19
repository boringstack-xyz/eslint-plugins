import tsParser from "@typescript-eslint/parser";
import reactComponentArchitecture from "eslint-plugin-react-component-architecture";

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
      "react-component-architecture": reactComponentArchitecture
    },
    rules: reactComponentArchitecture.configs.recommended.rules
  }
];
