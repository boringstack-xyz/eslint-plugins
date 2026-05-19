import tsParser from "@typescript-eslint/parser";
import drizzleConventions from "eslint-plugin-drizzle-conventions";

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
      "drizzle-conventions": drizzleConventions
    },
    rules: drizzleConventions.configs.recommended.rules
  }
];
