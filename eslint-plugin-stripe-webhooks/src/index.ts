import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { handlerMustBeIdempotentRule } from "./rules/handlerMustBeIdempotent";
import { handlerMustHandleEventTypeRule } from "./rules/handlerMustHandleEventType";
import { handlerMustVerifySignatureRule } from "./rules/handlerMustVerifySignature";
import { noParsedBodyBeforeVerificationRule } from "./rules/noParsedBodyBeforeVerification";
import { requireStripeSignatureHeaderRule } from "./rules/requireStripeSignatureHeader";
import { serviceMustConstructEventRule } from "./rules/serviceMustConstructEvent";

type StripeWebhooksPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: StripeWebhooksPlugin = {
  meta: {
    name: "eslint-plugin-stripe-webhooks",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "stripe-webhooks": plugin
  },
  rules: recommendedRules
};

export {
  handlerMustBeIdempotentRule,
  handlerMustHandleEventTypeRule,
  handlerMustVerifySignatureRule,
  noParsedBodyBeforeVerificationRule,
  requireStripeSignatureHeaderRule,
  serviceMustConstructEventRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
