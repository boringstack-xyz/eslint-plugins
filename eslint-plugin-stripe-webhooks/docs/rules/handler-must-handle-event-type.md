# handler-must-handle-event-type

Stripe webhook handlers must branch on `event.type` so unrelated event kinds aren't silently treated alike.

## Rationale

A function that accepts a `Stripe.Event` and treats it as a single shape is a bug magnet — Stripe sends `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.paid`, `customer.subscription.deleted`, and dozens more through the same endpoint. Without `switch (event.type)` (or an `if`-chain), your handler runs identical logic for every event kind, often interpreting fields that don't exist on the wrong shape.

## ❌ Incorrect

```ts
import Stripe from "stripe";

export function handle(event: Stripe.Event) {
  console.log(event);
  await doSomething(event.data.object); // assumes one shape; treats every type alike
}
```

## ✅ Correct

```ts
import Stripe from "stripe";

export function handle(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      return onPaymentSucceeded(event.data.object);
    case "invoice.paid":
      return onInvoicePaid(event.data.object);
    default:
      return; // log unknown / new event types explicitly
  }
}
```

If/else chains are also accepted:

```ts
if (event.type === "payment_intent.succeeded") return onSuccess(event);
if (event.type === "invoice.paid") return onInvoice(event);
```

Destructured `type` is also accepted:

```ts
const { type } = event;
switch (type) {
  case "payment_intent.succeeded": ...
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requireDefaultCase` | `boolean` | `false` | When `true`, `switch (event.type)` statements must include a `default:` branch. Stripe adds new event types over time — having a `default` makes the unknown-event policy explicit (log? ignore? alert?). |

## Detection

A function qualifies as a Stripe event handler if either:
- A parameter has a TS type annotation referencing `Stripe.Event` (or an aliased `Event` import from `stripe`).
- A parameter is named exactly `event` AND the file imports from `stripe`.

## What this does NOT catch

- Handlers that switch on `event.type` but then do nothing in any case.
- Handlers whose branching logic lives in a callee in another module.
- Sub-types within a single event family (e.g., differentiating `payment_intent.succeeded` flow paths by `event.data.object.metadata.kind`).

## Autofix

No.

## Version added

0.1.0
