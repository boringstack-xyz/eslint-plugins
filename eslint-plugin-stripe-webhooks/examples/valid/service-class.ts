import Stripe from "stripe";

export class StripeWebhookService {
  constructor(
    private readonly stripe: Stripe,
    private readonly secret: string
  ) {}

  async handleWebhook(body: string, sig: string): Promise<void> {
    const event = this.constructWebhookEvent(body, sig);

    if (await this.alreadyProcessed(event.id)) {
      return;
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        // domain logic ...
        break;
      default:
        break;
    }
  }

  constructWebhookEvent(body: string, sig: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(body, sig, this.secret);
  }

  private async alreadyProcessed(_id: string): Promise<boolean> {
    return false;
  }
}
