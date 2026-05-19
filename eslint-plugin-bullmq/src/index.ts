import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { jobNameMustBeConstantRule } from "./rules/jobNameMustBeConstant";
import { jobOptionsMustSetAttemptsRule } from "./rules/jobOptionsMustSetAttempts";
import { noBlockingConcurrencyZeroRule } from "./rules/noBlockingConcurrencyZero";
import { queueOptionsMustSetRemoveOnCompleteRule } from "./rules/queueOptionsMustSetRemoveOnComplete";
import { queueOptionsMustSetRemoveOnFailRule } from "./rules/queueOptionsMustSetRemoveOnFail";
import { workerMustImplementCloseRule } from "./rules/workerMustImplementClose";
import { workerMustListenFailedRule } from "./rules/workerMustListenFailed";

type BullmqPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: BullmqPlugin = {
  meta: {
    name: "eslint-plugin-bullmq",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    bullmq: plugin
  },
  rules: recommendedRules
};

export {
  jobNameMustBeConstantRule,
  jobOptionsMustSetAttemptsRule,
  noBlockingConcurrencyZeroRule,
  queueOptionsMustSetRemoveOnCompleteRule,
  queueOptionsMustSetRemoveOnFailRule,
  workerMustImplementCloseRule,
  workerMustListenFailedRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
