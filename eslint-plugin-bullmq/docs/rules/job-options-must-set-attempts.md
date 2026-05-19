# job-options-must-set-attempts

Every `<queue>.add(...)` must configure `attempts` (per-call or via `defaultJobOptions`); when `attempts > 1`, also require `backoff` so retries aren't tight loops.

## Rationale

Production queues see transient failures all the time — Redis hiccups, downstream timeouts, dependency restarts. The default of `attempts: 1` (no retry) means every transient failure becomes a permanent failure.

Configure retries:

- `attempts: <N>` — try the job N times before marking it permanently failed.
- `backoff: { type: "exponential", delay: 1000 }` — back off between attempts.

Without `backoff`, retries fire back-to-back. The same dependency that just failed is unlikely to be ready 1ms later — three retries finish in 3ms with three identical errors, exhausting your retry budget for nothing.

## ❌ Incorrect

```ts
const emailQueue = new Queue("email");

emailQueue.add(NAME, {}, {});                  // missing attempts
emailQueue.add(NAME, {}, { attempts: 5 });     // attempts > 1 but no backoff
```

## ✅ Correct

Per-call:

```ts
emailQueue.add(NAME, {}, {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 }
});
```

`attempts: 1` is OK without backoff — there are no retries:

```ts
emailQueue.add(NAME, {}, { attempts: 1 });
```

Queue-level default (preferred):

```ts
const emailQueue = new Queue("email", {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 }
  }
});

emailQueue.add(NAME, {}); // inherits defaultJobOptions
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requireBackoff` | `boolean` | `true` | When `true`, require `backoff` whenever `attempts` is anything other than the literal `1`. Set to `false` to only require `attempts`. |

## Detection

Two-pass within the file:

1. Collect `new Queue(...)` definitions and their `defaultJobOptions`.
2. For each `<queue>.add(...)` call:
   - Check the per-call options arg for `attempts` / `backoff`.
   - Fall back to the queue's `defaultJobOptions`.
   - Report `missingAttempts` if neither has it.
   - Report `missingBackoff` if `attempts` is present but not the literal `1`, and `backoff` is missing.

## Limitations

- Cross-file queue defaults aren't seen.
- Computed / dynamic `attempts` values (e.g., from a config object) skip the `attempts: 1` short-circuit and require `backoff` to be present — conservatively. This trades a small risk of false positives for the larger safety win.

## Autofix

No.

## Version added

0.1.0
