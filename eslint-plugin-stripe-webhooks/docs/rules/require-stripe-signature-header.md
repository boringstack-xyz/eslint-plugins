# require-stripe-signature-header

Require the signature passed into `*.constructEvent(...)` to come from the Stripe-signature request header, and forbid hard-coded `whsec_*` secrets.

## Rationale

`constructEvent(rawBody, signature, secret)` is only as secure as its inputs. Two failure modes:

1. **Wrong signature source.** Passing `req.headers.authorization` (or a literal, or an arbitrary header) means verification doesn't actually verify Stripe's signed payload — anything that decodes to bytes will pass.
2. **Hard-coded secret.** `whsec_*` strings committed to source leak the verification key. An attacker with read access to the repo can forge events.

The signature must come from the request header that Stripe set.

## ❌ Incorrect

```ts
// Wrong source
const event = stripe.webhooks.constructEvent(body, "sig", secret);
const event2 = stripe.webhooks.constructEvent(body, headers.authorization, secret);

// Hard-coded secret
const event3 = stripe.webhooks.constructEvent(body, sig, "whsec_abc123");
```

## ✅ Correct

```ts
// Web Fetch / Next.js / Hono / Elysia
const sig = request.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, sig, process.env.WEBHOOK_SECRET!);
```

```ts
// Express / Fastify / Node-HTTP
const event = stripe.webhooks.constructEvent(
  body,
  req.headers["stripe-signature"],
  process.env.WEBHOOK_SECRET!
);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowedHeaderNames` | `string[]` | `["stripe-signature"]` | Header names (lowercase) that are valid signature sources. |
| `constructEventNames` | `string[]` | `["constructEvent"]` | Method names that count as the verification call. |

## Detection

- Direct access patterns: `req.headers["stripe-signature"]`, `req.headers.stripeSignature` (camelCase normalization), `request.headers.get("stripe-signature")`, `ctx.request.headers.get("stripe-signature")`.
- Indirect: `const sig = request.headers.get("stripe-signature"); ... constructEvent(body, sig, ...)` — single-pass binding tracking.
- `??` / `||` fallback chains where any branch is a valid source.
- `as`-cast / non-null-assertion / `satisfies` wrappers.

## Autofix

No.

## Version added

0.1.0
