import {
  RULE_NAME,
  handlerMustVerifySignatureRule
} from "../../src/rules/handlerMustVerifySignature";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, handlerMustVerifySignatureRule, {
  valid: [
    {
      filename: "src/billing/webhook.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(request: Request) {
          const body = await request.text();
          const sig = request.headers.get("stripe-signature");
          const event = stripe.webhooks.constructEvent(body, sig, "secret");
          return Response.json({ received: true, type: event.type });
        }
      `
    },
    {
      filename: "src/api/stripe-webhook.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function handler(req: any) {
          const payload = req.rawBody;
          const event = stripe.webhooks.constructEvent(payload, req.headers["stripe-signature"], "s");
          return event;
        }
      `
    },
    {
      filename: "src/billing/route.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        async function webhookHandler(rawBody: string, sig: string) {
          const event = stripe.webhooks.constructEvent(rawBody, sig, "s");
          return event;
        }
      `
    },
    {
      filename: "src/billing/wrapper.ts",
      code: `
        async function webhookHandler(body: string) {
          const event = verifyStripeWebhook(body);
          return event;
        }
        declare function verifyStripeWebhook(body: string): unknown;
      `,
      options: [{ allowFunctions: ["verifyStripeWebhook"] }]
    },
    {
      filename: "src/services/users.ts",
      code: `
        export async function POST(request: Request) {
          const data = await request.json();
          return Response.json(data);
        }
      `
    },
    // Handler whose first param is typed `Stripe.Event` is post-
    // verification — accessing `event.data` etc. is fine.
    {
      code: `
        import Stripe from "stripe";
        export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            await db.upsert(session);
          }
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        const handler = async (event: Stripe.Event) => {
          await audit(event.id, event.type);
        };
        export const onStripeWebhook = handler;
      `
    }
  ],
  invalid: [
    {
      filename: "src/billing/webhook.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(request: Request) {
          const body = await request.json();
          const event = stripe.webhooks.constructEvent(body, "sig", "secret");
          return Response.json({});
        }
      `,
      errors: [{ messageId: "unverifiedPayload" }]
    },
    {
      filename: "src/billing/webhook.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function webhookHandler(req: any) {
          const body = req.rawBody;
          const data = body.data;
          const event = stripe.webhooks.constructEvent(body, req.headers["stripe-signature"], "s");
        }
      `,
      errors: [{ messageId: "unverifiedPayload" }]
    },
    {
      filename: "src/billing/webhook.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function webhookHandler(req: any) {
          const rawBody = req.rawBody;
          await db.audit(rawBody);
          const event = stripe.webhooks.constructEvent(rawBody, "sig", "s");
        }
      `,
      errors: [{ messageId: "unverifiedPayload" }]
    },
    {
      filename: "src/billing/webhook.ts",
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function webhookHandler(req: any) {
          const body = req.rawBody;
          process(body);
          const event = stripe.webhooks.constructEvent(body, "sig", "s");
        }
        declare function process(b: unknown): void;
      `,
      errors: [{ messageId: "unverifiedPayload" }]
    }
  ]
});
