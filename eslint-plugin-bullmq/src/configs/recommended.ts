export const recommendedRules = {
  "bullmq/worker-must-implement-close": "error",
  "bullmq/worker-must-listen-failed": "error",
  "bullmq/job-name-must-be-constant": "error",
  "bullmq/queue-options-must-set-removeoncomplete": "error",
  "bullmq/queue-options-must-set-removeonfail": "error",
  "bullmq/job-options-must-set-attempts": "error",
  "bullmq/no-blocking-concurrency-zero": "error"
} as const;
