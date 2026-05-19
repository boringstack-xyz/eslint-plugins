import Stripe from "stripe";

declare const db: {
  payments: { insert(args: unknown): Promise<void> };
};

// ❌  performs a DB insert without dedupe on event.id — Stripe may redeliver this event
export async function handle(event: Stripe.Event) {
  if (event.type === "payment_intent.succeeded") {
    await db.payments.insert({
      amount: (event.data.object as { amount: number }).amount
    });
  }
}
