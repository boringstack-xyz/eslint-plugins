import { handlerMustBeIdempotentRule } from "./handlerMustBeIdempotent";
import { handlerMustHandleEventTypeRule } from "./handlerMustHandleEventType";
import { handlerMustVerifySignatureRule } from "./handlerMustVerifySignature";
import { noParsedBodyBeforeVerificationRule } from "./noParsedBodyBeforeVerification";
import { requireStripeSignatureHeaderRule } from "./requireStripeSignatureHeader";
import { serviceMustConstructEventRule } from "./serviceMustConstructEvent";

export const rules = {
  "handler-must-verify-signature": handlerMustVerifySignatureRule,
  "no-parsed-body-before-verification": noParsedBodyBeforeVerificationRule,
  "require-stripe-signature-header": requireStripeSignatureHeaderRule,
  "handler-must-handle-event-type": handlerMustHandleEventTypeRule,
  "handler-must-be-idempotent": handlerMustBeIdempotentRule,
  "service-must-construct-event": serviceMustConstructEventRule
};
