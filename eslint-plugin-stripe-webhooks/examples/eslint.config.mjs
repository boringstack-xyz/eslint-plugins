import tsParser from "@typescript-eslint/parser";
import stripeWebhooks from "eslint-plugin-stripe-webhooks";

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
      "stripe-webhooks": stripeWebhooks
    },
    rules: stripeWebhooks.configs.recommended.rules
  }
];
