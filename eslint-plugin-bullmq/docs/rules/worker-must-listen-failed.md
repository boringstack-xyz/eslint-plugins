# worker-must-listen-failed

Every `new Worker(...)` must register listeners for required events (default `failed`) — BullMQ failures are silent unless explicitly subscribed.

## Rationale

When a BullMQ Worker's processor function throws, the job is marked failed and BullMQ fires a `failed` event on the worker — but only if you subscribed. Without `worker.on("failed", ...)`, every error gets swallowed. Your dashboard shows "everything's fine," your tasks aren't getting done, and there's no log line telling you anything went wrong.

Subscribe to `failed` (and any other event your operations team relies on, e.g., `stalled` for long-running jobs).

## ❌ Incorrect

```ts
import { Worker } from "bullmq";

const worker = new Worker("queue", async () => { /* ... */ });
worker.on("completed", () => {}); // OK to subscribe to completed, but failed is missing
```

## ✅ Correct

```ts
import { Worker } from "bullmq";

const worker = new Worker("queue", async () => { /* ... */ });

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Worker job failed");
  metrics.increment("worker.job.failed");
});
```

For class-owned workers:

```ts
export class JobService {
  private worker = new Worker("queue", async () => { /* ... */ });

  constructor() {
    this.worker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Worker job failed");
    });
  }

  async close() {
    await this.worker.close();
  }
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requiredEvents` | `string[]` | `["failed"]` | Events that must be subscribed for every Worker. Common additions: `"stalled"`, `"error"`. |

## Detection

For each `new Worker(...)` NewExpression in the file, the rule resolves the binding:

- `const w = new Worker(...)` → binding key `w`.
- `private w = new Worker(...)` (class field) → binding key `this.w`.
- `this.w = new Worker(...)` (constructor / method assignment) → binding key `this.w`.

For each binding, the file is scanned for `<binding>.on("<event>", ...)` calls — if any required event is missing, the rule fires once per missing event per worker.

## Limitations

- Listeners registered via a helper or in a separate file aren't seen.
- Listeners attached after re-export (`globalWorker.on(...)`) won't match if the receiver name differs from the original binding.
- Anonymous workers (`new Worker(...)` not assigned anywhere) are skipped — there's no binding to track listeners against.

## Autofix

No.

## Version added

0.1.0
