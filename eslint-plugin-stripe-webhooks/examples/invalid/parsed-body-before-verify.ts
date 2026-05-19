import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ❌  request.json() parses the body, destroying the bytes Stripe signed
export async function POST(request: Request) {
  const body = await request.json();
  const event = stripe.webhooks.constructEvent(
    body,
    "sig",
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  return new Response(JSON.stringify({ received: true, type: event.type }));
}
