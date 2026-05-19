import tsParser from "@typescript-eslint/parser";
import jwtCookies from "eslint-plugin-jwt-cookies";

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
      "jwt-cookies": jwtCookies
    },
    rules: {
      "jwt-cookies/auth-cookie-must-be-httponly": "error",
      "jwt-cookies/auth-cookie-must-be-secure-in-prod": "error",
      "jwt-cookies/bcrypt-rounds-min": ["error", { minRounds: 12 }]
    }
  }
];
