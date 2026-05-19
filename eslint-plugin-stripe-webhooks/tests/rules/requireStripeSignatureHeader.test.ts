import {
  RULE_NAME,
  requireStripeSignatureHeaderRule
} from "../../src/rules/requireStripeSignatureHeader";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireStripeSignatureHeaderRule, {
  valid: [
    {
      code: `
        const event = stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature"), secret);
      `
    },
    {
      code: `
        const event = stripe.webhooks.constructEvent(body, req.headers["stripe-signature"], secret);
      `
    },
    {
      code: `
        const sig = request.headers.get("stripe-signature");
        const event = stripe.webhooks.constructEvent(body, sig, secret);
      `
    },
    {
      code: `
        const sig = req.headers["stripe-signature"] ?? "";
        const event = stripe.webhooks.constructEvent(body, sig, process.env.WEBHOOK_SECRET);
      `
    },
    // Verifier method: the `signature` arg is a parameter, the actual
    // header read happens at the caller. Default `verifierMethodPatterns`
    // matches `^constructWebhookEvent$`.
    {
      code: `
        export class BillingService {
          constructWebhookEvent(payload: string, signature: string) {
            return stripe.webhooks.constructEvent(payload, signature, secret);
          }
        }
      `
    },
    {
      code: `
        export function verifyWebhookEvent(payload: string, signature: string) {
          return stripe.webhooks.constructEvent(payload, signature, secret);
        }
      `
    },
    {
      code: `
        const verifyStripeWebhook = (payload: string, signature: string) =>
          stripe.webhooks.constructEvent(payload, signature, secret);
      `
    }
  ],
  invalid: [
    {
      code: `
        const event = stripe.webhooks.constructEvent(body, "sig", secret);
      `,
      errors: [{ messageId: "invalidSignatureSource" }]
    },
    {
      code: `
        const event = stripe.webhooks.constructEvent(body, headers.authorization, secret);
      `,
      errors: [{ messageId: "invalidSignatureSource" }]
    },
    {
      code: `
        const event = stripe.webhooks.constructEvent(body, sig, "whsec_abc123");
      `,
      errors: [
        { messageId: "invalidSignatureSource" },
        { messageId: "hardcodedWebhookSecret" }
      ]
    },
    {
      code: `
        const SECRET = "whsec_test_only";
        const event = stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature"), SECRET);
      `,
      errors: [{ messageId: "hardcodedWebhookSecret" }]
    }
  ]
});
