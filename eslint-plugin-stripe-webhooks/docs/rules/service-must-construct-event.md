# service-must-construct-event

Stripe-aware classes that contain any `webhook`-named method must also contain a verifier method (default name `constructWebhookEvent`) whose body calls `*.constructEvent(...)`.

## Rationale

When webhook handling lives on a class, it's easy to add a second handler method without re-running verification — every developer who writes a new "do something with webhook payload" method has to remember to verify first. Mandating a single, named verifier method on the class makes verification a structural requirement: every webhook method calls the one verifier, and the rule keeps the class shape intact.

## ❌ Incorrect

```ts
import Stripe from "stripe";

export class StripeService {
  handleWebhook(body: string) {
    return body; // no verification anywhere
  }
}
```

```ts
import Stripe from "stripe";

export class StripeService {
  handleWebhook(body: string, sig: string) {
    return this.constructWebhookEvent(body, sig);
  }
  constructWebhookEvent(body: string, sig: string) {
    return JSON.parse(body); // method exists but doesn't actually verify
  }
}
```

## ✅ Correct

```ts
import Stripe from "stripe";

export class StripeService {
  constructor(private stripe: Stripe, private secret: string) {}

  handleWebhook(body: string, sig: string) {
    const event = this.constructWebhookEvent(body, sig);
    // dispatch by event.type ...
  }

  constructWebhookEvent(body: string, sig: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(body, sig, this.secret);
  }
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `verifyMethodPattern` | `string` (regex) | `"^constructWebhookEvent$"` | Method name pattern that the verifier must match. |
| `constructEventNames` | `string[]` | `["constructEvent"]` | Method names that count as the inner verification call. |

## When does the rule fire?

- File imports from `stripe` or `@stripe/stripe-js`.
- Class has any method whose name contains `webhook` (case-insensitive).
- Class does NOT have a method matching `verifyMethodPattern`, OR the matching method's body doesn't contain a `constructEvent` call.

## What this does NOT catch

- Verification done by a sibling free function (rather than a class method).
- Webhook methods whose verification is delegated through inheritance from a base class in another file.

## Autofix

No.

## Version added

0.1.0
