# no-parsed-body-before-verification

Disallow parsed-body APIs (`request.json()`, `JSON.parse(body)`, `req.body.*`, `express.json()`) before `*.constructEvent(...)`.

## Rationale

Stripe's signature is computed over the **raw byte sequence** of the request body. Once any framework (Express's `express.json()`, Fastify's body parser, Next.js's `request.json()`) parses the JSON, the bytes are gone — the parsed object's keys may render to a different byte sequence than what Stripe signed. `constructEvent` will then reject every event, even legitimate ones, in a way that's confusing to debug.

Use `request.text()` (Web Fetch), `req.text()` (Express raw-body middleware), or `Buffer.from(...)` to keep the original bytes intact.

## ❌ Incorrect

```ts
// Next.js App Router
export async function POST(request: Request) {
  const body = await request.json();                          // parsed — bytes lost
  const event = stripe.webhooks.constructEvent(body, sig, k); // will fail
}
```

```ts
// Express with default JSON middleware
app.use(express.json());                                       // installs JSON parser
app.post("/webhook", (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, k);  // req.body is parsed
});
```

## ✅ Correct

```ts
// Next.js App Router
export async function POST(request: Request) {
  const body = await request.text();                           // raw bytes
  const event = stripe.webhooks.constructEvent(body, sig, k);
}
```

```ts
// Express with raw-body middleware on the Stripe route
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, k);
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `constructEventNames` | `string[]` | `["constructEvent"]` | Method names that count as the verification call. |

## What this catches

- `await request.json()` / `await req.json()` before any `constructEvent` in the same file.
- `JSON.parse(<x>)` before any `constructEvent`.
- `req.body.<member>` access before any `constructEvent`.
- `express.json()` / `bodyParser.json()` middleware factory calls in a Stripe-aware file (these globally install JSON parsing).

## What this does NOT catch

- Body parsing performed by middleware imported from a third-party package the rule doesn't recognize.
- Body parsing in a sibling file that runs before the webhook handler.

## Autofix

No.

## Version added

0.1.0
