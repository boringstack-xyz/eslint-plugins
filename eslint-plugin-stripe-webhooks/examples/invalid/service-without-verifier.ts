import Stripe from "stripe";

// ❌  class has a `handleWebhook` method but no `constructWebhookEvent` verifier method
export class StripeService {
  constructor(private readonly stripe: Stripe) {}

  async handleWebhook(body: string): Promise<void> {
    // pretends to handle the webhook but never verifies the signature
    console.log("got webhook:", body);
  }
}
