import tsParser from "@typescript-eslint/parser";
import bullmq from "eslint-plugin-bullmq";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: { bullmq },
    rules: bullmq.configs.recommended.rules
  }
];
