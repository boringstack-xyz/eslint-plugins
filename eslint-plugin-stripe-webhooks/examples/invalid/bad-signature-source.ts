import Stripe from "stripe";

declare const headers: Record<string, string>;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ❌  using `headers.authorization` as the signature source — verification doesn't actually verify
export function verify(body: string) {
  return stripe.webhooks.constructEvent(
    body,
    headers.authorization,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
