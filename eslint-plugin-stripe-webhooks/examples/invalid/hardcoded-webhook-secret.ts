import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ❌  hard-coded webhook secret in source — leaks the verification key
export function verify(body: string, sig: string) {
  return stripe.webhooks.constructEvent(body, sig, "whsec_abc123def456");
}
