# no-blocking-concurrency-zero

Disallow `new Worker(name, processor, { concurrency: <numericLiteral ≤ 0> })` — non-positive concurrency blocks job processing entirely.

## Rationale

`concurrency` must be ≥ 1 for the worker to do anything. `0` (or any negative number) is almost always a bug — usually a config-default that wasn't filled in, or an off-by-one in a calculation. The result: the worker boots without errors, registers listeners, and silently processes nothing. Jobs accumulate, dashboards look quiet, you only notice when a customer asks why their email never arrived.

## ❌ Incorrect

```ts
new Worker("queue", async () => {}, { concurrency: 0 });
new Worker("queue", async () => {}, { concurrency: -1 });
```

## ✅ Correct

```ts
new Worker("queue", async () => {}, { concurrency: 5 });

// Config-driven concurrency — fine, the rule won't flag identifiers / expressions
new Worker("queue", async () => {}, { concurrency: Number(process.env.CONCURRENCY) });
```

## Options

None.

## Detection

The rule only flags numeric literals (and unary-negated numeric literals like `-1`) ≤ 0. Identifier-valued concurrency (`{ concurrency }`), member-access (`config.concurrency`), and any computed expression are accepted — the rule assumes those are validated at runtime.

## Limitations

- A concurrency of `0` arrived at via runtime computation (e.g., `cores - cores`) is invisible to static analysis and won't be flagged.

## Autofix

No.

## Version added

0.1.0
