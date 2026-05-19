# eslint-plugin-stripe-webhooks

[![CI](https://github.com/agjs/eslint-plugin-stripe-webhooks/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-stripe-webhooks/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint plugin enforcing security and correctness rules for Stripe webhook handlers.

## Why

Stripe webhooks have two infamous failure modes:

1. **Unverified payloads.** Reading or parsing the request body before `*.constructEvent(...)` succeeds means an attacker can deliver a webhook-shaped payload to your endpoint and your handler will fire database writes / queue jobs / emails on it. The signature check never gets a chance to reject it.
2. **Non-idempotent and type-blind handling.** Stripe redelivers events on transient failures — a handler without a dedupe check on `event.id` will double-charge, double-email, double-publish. A handler that doesn't branch on `event.type` will run identical logic for every event kind.

These six rules pin down the patterns that prevent both.

## Install

```sh
pnpm add -D eslint-plugin-stripe-webhooks @typescript-eslint/parser
```

## Usage (flat config)

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import stripeWebhooks from "eslint-plugin-stripe-webhooks";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: { "stripe-webhooks": stripeWebhooks },
    rules: stripeWebhooks.configs.recommended.rules
  }
];
```

The recommended preset enables all six rules at `"error"`. Override per-rule via the standard ESLint mechanism.

## Rules

| Rule | Tier | Description |
|------|------|-------------|
| [`handler-must-verify-signature`](docs/rules/handler-must-verify-signature.md) | **TIER 1 SECURITY** | Disallow reading or forwarding the webhook payload before `*.constructEvent(...)` succeeds. |
| [`no-parsed-body-before-verification`](docs/rules/no-parsed-body-before-verification.md) | Security | Disallow parsed-body APIs (`request.json()`, `JSON.parse(body)`, `req.body`, `express.json()`) before verification. |
| [`require-stripe-signature-header`](docs/rules/require-stripe-signature-header.md) | Security | Require the signature passed into `constructEvent(...)` to come from the Stripe-signature header; forbid hard-coded `whsec_*` secrets. |
| [`handler-must-handle-event-type`](docs/rules/handler-must-handle-event-type.md) | Correctness | Stripe event handlers must branch on `event.type`. |
| [`handler-must-be-idempotent`](docs/rules/handler-must-be-idempotent.md) | Correctness | Webhook handlers performing side effects must consult `event.id` for dedupe. |
| [`service-must-construct-event`](docs/rules/service-must-construct-event.md) | Convention | Stripe-aware classes with a `webhook`-named method must also have a verifier method calling `constructEvent`. |

## Examples

### handler-must-verify-signature

```ts
// ❌
export async function POST(request: Request) {
  const body = await request.json();
  const event = stripe.webhooks.constructEvent(body, sig, k);
}

// ✅
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const event = stripe.webhooks.constructEvent(body, sig, process.env.WEBHOOK_SECRET!);
}
```

### handler-must-be-idempotent

```ts
// ❌
export async function handle(event: Stripe.Event) {
  if (event.type === "payment_intent.succeeded") {
    await db.payments.insert({ /* ... */ });
  }
}

// ✅
export async function handle(event: Stripe.Event) {
  if (await alreadyProcessed(event.id)) return;
  if (event.type === "payment_intent.succeeded") {
    await db.payments.insert({ /* ... */ });
  }
}
```

For complete per-rule docs and ❌/✅ snippets, see [`docs/rules/`](docs/rules/) and the runnable [`examples/`](examples/) (Next.js App Router, Express, Elysia/Hono, class-based services).

## Security philosophy

These rules are **best-effort static analysis**. They catch the common mistakes — reading `req.body` before `constructEvent`, hard-coded `whsec_*` secrets, missing `event.type` branching — but they cannot prove a webhook handler is correct. Specifically, no rule here is sufficient on its own. Pair them with:

- End-to-end tests against the [Stripe CLI](https://docs.stripe.com/cli) webhook simulator.
- A TIER 1 security review of every webhook entry point at PR time.
- Centralized verification (see `service-must-construct-event`) so the verification step lives in one place.

## Limitations of static analysis

- **No cross-function dataflow.** A body parameter passed into a helper in another file isn't tracked.
- **No type-aware inference.** `Stripe.Event` parameter detection relies on the literal type name + a Stripe import being present in the same file. Generic wrapper types (`MyEvent<Stripe.Event>`) aren't recognized.
- **Idempotency check detection is heuristic.** Helper functions abstracting the dedupe logic must be named per `allowedCheckFunctionPatterns`. DB unique-constraint-based dedupe isn't visible.
- **Verification by middleware** that this rule doesn't recognize will look like "no verification" to the rule.

When in doubt, prefer the explicit, in-handler `constructEvent` call over a clever abstraction — it's the pattern the rules optimize for.

## Development

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Release

Tag a `v*` version locally and push the tag. `.github/workflows/release.yml` runs `pnpm publish --access public --no-git-checks` with `NPM_TOKEN`.

## License

MIT.
