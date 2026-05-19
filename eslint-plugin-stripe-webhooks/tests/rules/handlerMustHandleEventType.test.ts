import {
  RULE_NAME,
  handlerMustHandleEventTypeRule
} from "../../src/rules/handlerMustHandleEventType";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, handlerMustHandleEventTypeRule, {
  valid: [
    {
      code: `
        import Stripe from "stripe";
        export function handle(event: Stripe.Event) {
          switch (event.type) {
            case "payment_intent.succeeded": return;
            case "payment_intent.failed": return;
            default: return;
          }
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export function handle(event: Stripe.Event) {
          if (event.type === "payment_intent.succeeded") return;
          if (event.type === "invoice.paid") return;
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export function handle(event: Stripe.Event) {
          const { type } = event;
          switch (type) {
            case "checkout.session.completed": return;
          }
        }
      `
    },
    {
      code: `
        import { Event } from "stripe";
        export function handle(event: Event) {
          if (event.type === "x") return;
        }
      `
    },
    {
      code: `
        export function handle(event: any) {
          // not in Stripe-aware file
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import Stripe from "stripe";
        export function handle(event: Stripe.Event) {
          console.log(event);
        }
      `,
      errors: [{ messageId: "noEventBranching" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export function handle(event) {
          process(event);
        }
      `,
      errors: [{ messageId: "noEventBranching" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export function handle(event: Stripe.Event) {
          const { type } = event;
          console.log(type);
        }
      `,
      errors: [{ messageId: "noEventBranching" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export function handle(event: Stripe.Event) {
          switch (event.type) {
            case "payment_intent.succeeded": return;
          }
        }
      `,
      options: [{ requireDefaultCase: true }],
      errors: [{ messageId: "missingDefaultCase" }]
    }
  ]
});
