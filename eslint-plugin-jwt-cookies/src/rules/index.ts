import { authCookieMustBeHttpOnlyRule } from "./auth-cookie-must-be-httponly";
import { authCookieMustBeSecureInProdRule } from "./auth-cookie-must-be-secure-in-prod";
import { bcryptRoundsMinRule } from "./bcrypt-rounds-min";

export const rules = {
  "auth-cookie-must-be-httponly": authCookieMustBeHttpOnlyRule,
  "auth-cookie-must-be-secure-in-prod": authCookieMustBeSecureInProdRule,
  "bcrypt-rounds-min": bcryptRoundsMinRule
};
