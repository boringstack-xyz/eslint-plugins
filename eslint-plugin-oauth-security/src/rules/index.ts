import { pkceRequiredForOidcRule } from "./pkce-required-for-oidc";
import { stateMustBeRedisBackedRule } from "./state-must-be-redis-backed";
import { stateTtlBoundedRule } from "./state-ttl-bounded";

export const rules = {
  "state-must-be-redis-backed": stateMustBeRedisBackedRule,
  "pkce-required-for-oidc": pkceRequiredForOidcRule,
  "state-ttl-bounded": stateTtlBoundedRule
};
