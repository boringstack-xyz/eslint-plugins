# handler-must-be-idempotent

Stripe may deliver the same event multiple times. Webhook handlers must consult `event.id` (via a dedupe check) before performing irreversible side effects.

## Rationale

Stripe's delivery guarantee is **at-least-once**, not exactly-once. The same event will be redelivered on:
- Network failures or timeouts.
- HTTP 5xx responses (Stripe retries with backoff for up to 3 days).
- Manual replay from the Stripe Dashboard.

Handlers that perform irreversible side effects without a dedupe check end up double-charging, double-emailing, double-publishing, double-creating. Every webhook event has a stable `event.id` (`evt_*`) — store the processed ones, check before acting.

## ❌ Incorrect

```ts
import Stripe from "stripe";

export async function handle(event: Stripe.Event) {
  if (event.type === "payment_intent.succeeded") {
    await db.payments.insert({ amount: event.data.object.amount });
    await mailer.send({ to: customer.email });
  }
}
```

## ✅ Correct

```ts
import Stripe from "stripe";

export async function handle(event: Stripe.Event) {
  if (await alreadyProcessed(event.id)) return;

  if (event.type === "payment_intent.succeeded") {
    await db.payments.insert({ amount: event.data.object.amount });
    await mailer.send({ to: customer.email });
  }

  await markProcessed(event.id);
}
```

The rule accepts any of these check shapes:

```ts
if (await alreadyProcessed(event.id)) return;
if (await isProcessed(event.id)) return;
if (await ensureIdempotent(event.id)) return;
if (processedEventIds.has(event.id)) return;
const seen = await db.webhookEvents.findUnique({ where: { id: event.id } });
if (seen) return;
```

Method names that contain any of the configured patterns (case-insensitive) count as a check.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowedCheckFunctionPatterns` | `string[]` | `["alreadyProcessed", "isProcessed", "ensureIdempotent", "hasProcessed", "dedupe"]` | Substrings (case-insensitive) that, if present in a function name called inside the handler, satisfy the dedupe requirement. |

## What this catches

A function qualifying as a Stripe event handler (parameter typed `Stripe.Event` or named `event` in a Stripe-aware file) that:
- Calls a method named `insert` / `update` / `create` / `save` / `upsert` / `delete` / `publish` / `send` / `sendMail` / `enqueue` / `dispatch` / `trigger` (DB writes, queue publishes, email sends), AND
- Has no recognizable dedupe check anywhere in the function body.

## What this does NOT catch

- Dedupe logic abstracted into a helper called from a different file.
- Dedupe via DB unique constraints (the rule can't see schema constraints).
- Side effects performed in callees not visible to the rule.
- Idempotent operations that don't need a dedupe check (e.g., setting a value to a deterministic state).

This is a **heuristic, low-confidence** rule — its signal:noise ratio depends heavily on your project's naming conventions. If you abstract dedupe under a function name not in the default patterns, add it via `allowedCheckFunctionPatterns`.

## Autofix

No.

## Version added

0.1.0
