import tsParser from "@typescript-eslint/parser";
import cacheKeys from "eslint-plugin-cache-keys";

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
      "cache-keys": cacheKeys
    },
    rules: {
      "cache-keys/cache-set-must-have-ttl": "error",
      "cache-keys/cache-key-must-be-prefixed": [
        "error",
        { prefixes: ["cache:", "stripe:", "session:"] }
      ],
      "cache-keys/cache-key-from-helper": [
        "error",
        { helperNames: ["userCacheKey", "stripeEventCacheKey"] }
      ]
    }
  }
];
