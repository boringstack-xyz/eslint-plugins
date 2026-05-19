import {
  RULE_NAME,
  handlerMustBeIdempotentRule
} from "../../src/rules/handlerMustBeIdempotent";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, handlerMustBeIdempotentRule, {
  valid: [
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          if (await alreadyProcessed(event.id)) return;
          await db.insert({ id: event.id });
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          const seen = await db.webhookEvents.findUnique({ where: { id: event.id } });
          if (seen) return;
          await mailer.send({ to: "x" });
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          // no side effects
          console.log(event.type);
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          if (processedEventIds.has(event.id)) return;
          await queue.publish(event.data.object);
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          await ensureIdempotent(event.id);
          await db.update({});
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          await db.insert({ data: event.data });
        }
      `,
      errors: [{ messageId: "missingIdempotency" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          if (event.type === "x") {
            await mailer.send({ to: "y" });
          }
        }
      `,
      errors: [{ messageId: "missingIdempotency" }]
    },
    {
      code: `
        import Stripe from "stripe";
        export async function handle(event: Stripe.Event) {
          await queue.publish(event);
          await db.create({});
        }
      `,
      errors: [{ messageId: "missingIdempotency" }]
    }
  ]
});
