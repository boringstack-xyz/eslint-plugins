// app/api/webhook/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const data = JSON.parse(body); // ← parsed before verification
  await someService.doStuff(data);

  const event = stripe.webhooks.constructEvent(
    body,
    request.headers.get("stripe-signature")!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  return new Response(JSON.stringify({ received: true, type: event.type }));
}

declare const someService: { doStuff(_: unknown): Promise<void> };
