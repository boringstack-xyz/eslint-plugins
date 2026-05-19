// app/api/billing/webhook/route.ts (Next.js App Router)
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

declare const db: {
  webhookEvents: {
    findUnique(args: { where: { id: string } }): Promise<unknown>;
  };
  payments: { insert(args: unknown): Promise<void> };
};

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("missing signature", { status: 400 });
  }

  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);

  if (await db.webhookEvents.findUnique({ where: { id: event.id } })) {
    return Response.json({ received: true, deduped: true });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await db.payments.insert({ id: event.id });
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}
