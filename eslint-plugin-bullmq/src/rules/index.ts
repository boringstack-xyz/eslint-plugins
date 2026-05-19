import { jobNameMustBeConstantRule } from "./jobNameMustBeConstant";
import { jobOptionsMustSetAttemptsRule } from "./jobOptionsMustSetAttempts";
import { noBlockingConcurrencyZeroRule } from "./noBlockingConcurrencyZero";
import { queueOptionsMustSetRemoveOnCompleteRule } from "./queueOptionsMustSetRemoveOnComplete";
import { queueOptionsMustSetRemoveOnFailRule } from "./queueOptionsMustSetRemoveOnFail";
import { workerMustImplementCloseRule } from "./workerMustImplementClose";
import { workerMustListenFailedRule } from "./workerMustListenFailed";

export const rules = {
  "worker-must-implement-close": workerMustImplementCloseRule,
  "worker-must-listen-failed": workerMustListenFailedRule,
  "job-name-must-be-constant": jobNameMustBeConstantRule,
  "queue-options-must-set-removeoncomplete": queueOptionsMustSetRemoveOnCompleteRule,
  "queue-options-must-set-removeonfail": queueOptionsMustSetRemoveOnFailRule,
  "job-options-must-set-attempts": jobOptionsMustSetAttemptsRule,
  "no-blocking-concurrency-zero": noBlockingConcurrencyZeroRule
};
