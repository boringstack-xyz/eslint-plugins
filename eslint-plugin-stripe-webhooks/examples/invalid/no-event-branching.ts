import Stripe from "stripe";

// ❌  handler accepts a Stripe.Event but never branches on event.type
export function handle(event: Stripe.Event) {
  console.log("got event:", event);
  // every event kind ends up here, regardless of type
  // (no switch / if-chain on event.type)
}
