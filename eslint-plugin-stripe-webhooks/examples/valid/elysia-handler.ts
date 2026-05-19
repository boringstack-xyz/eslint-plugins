// Elysia (or Hono) handler with raw-body verification
import Stripe from "stripe";

declare const app: {
  post(path: string, handler: (ctx: any) => unknown): typeof app;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

declare function ensureIdempotent(id: string): Promise<boolean>;
declare const queue: { publish(args: unknown): Promise<void> };

export const webhookRoute = app.post(
  "/billing/webhook",
  async ({ request, set }: { request: Request; set: { status: number } }) => {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      set.status = 400;
      return { error: "missing signature" };
    }

    const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);

    if (await ensureIdempotent(event.id)) {
      return { received: true, deduped: true };
    }

    switch (event.type) {
      case "checkout.session.completed":
        await queue.publish({ type: event.type, id: event.id });
        break;
      default:
        break;
    }

    return { received: true };
  }
);
