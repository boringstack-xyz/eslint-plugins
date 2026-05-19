import tsParser from "@typescript-eslint/parser";
import testConventions from "eslint-plugin-test-conventions";

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
      "test-conventions": testConventions
    },
    rules: {
      "test-conventions/no-focused-tests": "error",
      "test-conventions/no-direct-db-in-tests": [
        "error",
        {
          testFiles: ["tests/**/*.ts", "**/*.test.ts"],
          forbiddenPaths: ["**/db/**", "drizzle-orm"],
          helpersPath: "tests/helpers/db"
        }
      ],
      "test-conventions/test-file-mirrors-source": "error"
    }
  }
];
