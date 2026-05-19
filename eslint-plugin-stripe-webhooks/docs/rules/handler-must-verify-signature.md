# handler-must-verify-signature

**TIER 1 SECURITY** — protects against forged Stripe events.

Disallow reading or forwarding the webhook payload before a successful `*.constructEvent(...)` call.

## Rationale

Stripe signs every webhook event with a secret you control. The `constructEvent(rawBody, signature, secret)` call is the verification — if the signature doesn't match, it throws. Code that reads / parses / forwards the body BEFORE that call accepts forged events: an attacker can deliver a webhook-shaped payload to your endpoint, your handler will fire database writes / queue jobs / emails based on it, and `constructEvent` never gets a chance to reject it.

Always verify first. Only after `constructEvent` returns do you have a trustworthy `event` object.

## ❌ Incorrect

```ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.json();           // parsed body — already a forgery vector
  const userId = body.data.object.customer;     // used before verification
  await db.insert({ user: userId });            // forged events accepted
  const event = stripe.webhooks.constructEvent(body, sig, secret);
}
```

## ✅ Correct

```ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();            // raw bytes — required for verification
  const sig = request.headers.get("stripe-signature")!;
  const event = stripe.webhooks.constructEvent(body, sig, process.env.WEBHOOK_SECRET!);
  // body is now safe to use via `event` — every field is verified
  return Response.json({ received: true, type: event.type });
}
```

You can also keep verification centralized in a wrapper and add it to `allowFunctions`:

```ts
async function POST(request: Request) {
  const body = await request.text();
  const event = await verifyStripeWebhook(body, request.headers);
  // ...
}
```

```js
"stripe-webhooks/handler-must-verify-signature": [
  "error",
  { allowFunctions: ["verifyStripeWebhook"] }
]
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `webhookFilePattern` | `string \| string[]` (globs) | `["**/billing/**/*.{ts,tsx}", "**/webhooks/**/*.{ts,tsx}", "**/stripe/**/*.{ts,tsx}", "**/*webhook*.{ts,tsx}"]` | Files that count as webhook handlers regardless of function/import signals. |
| `constructEventNames` | `string[]` | `["constructEvent"]` | Method names that count as the verification call. |
| `allowFunctions` | `string[]` | `[]` | Wrapper function names trusted to perform verification internally. The body parameter passed into them isn't flagged. |
| `bodyParamNames` | `string[]` | `["payload", "body", "rawBody"]` | Identifier names treated as the request body. |

## What this catches

- `await request.json()` / `JSON.parse(body)` / `req.body.x` reads before `constructEvent`.
- The body parameter passed as an argument to a service / DB / queue / email call before `constructEvent`.
- The body destructured / accessed for any subsequent operation in the handler before verification.

## What this does NOT catch

- Verification deferred to a callee in another module that this rule can't see (without parser services + cross-module analysis).
- Body bytes leaked through closures or globals.
- Async race conditions where `constructEvent` is called but its rejection is swallowed.
- Verification using a secret that doesn't actually match the deployed webhook endpoint.

This is **best-effort static analysis**. Pair it with end-to-end tests against the Stripe CLI's webhook simulator and a TIER 1 review of every webhook entry point.

## Autofix

No.

## Version added

0.1.0
