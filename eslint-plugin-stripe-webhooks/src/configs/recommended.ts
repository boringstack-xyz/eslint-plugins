export const recommendedRules = {
  "stripe-webhooks/handler-must-verify-signature": "error",
  "stripe-webhooks/no-parsed-body-before-verification": "error",
  "stripe-webhooks/require-stripe-signature-header": "error",
  "stripe-webhooks/handler-must-handle-event-type": "error",
  "stripe-webhooks/handler-must-be-idempotent": "error",
  "stripe-webhooks/service-must-construct-event": "error"
} as const;
