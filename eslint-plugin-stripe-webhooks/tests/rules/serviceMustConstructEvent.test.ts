import {
  RULE_NAME,
  serviceMustConstructEventRule
} from "../../src/rules/serviceMustConstructEvent";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, serviceMustConstructEventRule, {
  valid: [
    {
      code: `
        import Stripe from "stripe";
        export class StripeService {
          handleWebhook(body: string, sig: string) {
            const event = this.constructWebhookEvent(body, sig);
            return event;
          }
          constructWebhookEvent(body: string, sig: string) {
            return stripe.webhooks.constructEvent(body, sig, "s");
          }
        }
        declare const stripe: any;
      `
    },
    {
      code: `
        export class NotStripe {
          handleWebhook() { return null; }
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export class JustListsThings {
          list() { return []; }
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export class Custom {
          processWebhook(body: string, sig: string) {
            return this.verify(body, sig);
          }
          verify(body: string, sig: string) {
            return stripe.webhooks.constructEvent(body, sig, "s");
          }
        }
        declare const stripe: any;
      `,
      options: [{ verifyMethodPattern: "^verify$" }]
    }
  ],
  invalid: [
    {
      code: `
        import Stripe from "stripe";
        export class StripeService {
          handleWebhook(body: string) {
            return body;
          }
        }
      `,
      errors: [{ messageId: "missingVerifierMethod" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export class StripeService {
          handleWebhook(body: string, sig: string) {
            return this.constructWebhookEvent(body, sig);
          }
          constructWebhookEvent(body: string, sig: string) {
            return JSON.parse(body);
          }
        }
      `,
      errors: [{ messageId: "missingVerifierMethod" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export class StripeService {
          processWebhook(body: string) {
            return body;
          }
          notTheVerifier(body: string) {
            return stripe.webhooks.constructEvent(body, "sig", "s");
          }
        }
        declare const stripe: any;
      `,
      errors: [{ messageId: "missingVerifierMethod" }]
    }
  ]
});
