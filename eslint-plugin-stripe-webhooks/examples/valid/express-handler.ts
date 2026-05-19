import Stripe from "stripe";

declare const express: {
  raw(opts: { type: string }): unknown;
  Router(): unknown;
};
declare const router: {
  post(path: string, raw: unknown, handler: (req: any, res: any) => unknown): unknown;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

declare function alreadyProcessed(id: string): Promise<boolean>;
declare const db: { payments: { insert(args: unknown): Promise<void> } };

export function mountWebhook() {
  router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req: any, res: any) => {
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        WEBHOOK_SECRET
      );

      if (await alreadyProcessed(event.id)) {
        return res.json({ received: true, deduped: true });
      }

      switch (event.type) {
        case "payment_intent.succeeded":
          await db.payments.insert({ id: event.id });
          break;
        default:
          break;
      }

      return res.json({ received: true });
    }
  );
}
