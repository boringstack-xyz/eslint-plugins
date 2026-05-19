# worker-must-implement-close

Classes that own a `new Worker(...)` instance must declare a close-equivalent method so workers can be drained during graceful shutdown.

## Rationale

A BullMQ Worker holds open Redis connections and consumes jobs as long as it's running. When your process receives `SIGTERM`/`SIGINT`, you have a small window to:

1. Stop accepting new jobs.
2. Wait for in-flight jobs to finish.
3. Disconnect from Redis cleanly.

That's exactly what `await worker.close()` does. Without it, in-flight jobs are abandoned mid-execution, Redis connections leak, and stalled-job recovery has to clean up state at the next deploy. A class that *owns* a Worker must expose a close-equivalent method so the application's shutdown handler has something to call.

## ❌ Incorrect

```ts
import { Worker } from "bullmq";

export class JobService {
  private worker = new Worker("queue", async () => { /* ... */ });
  // no close / shutdown / dispose / onModuleDestroy
}
```

## ✅ Correct

```ts
import { Worker } from "bullmq";

export class JobService {
  private worker = new Worker("queue", async () => { /* ... */ });

  async close(): Promise<void> {
    await this.worker.close();
  }
}
```

For NestJS, implement `onModuleDestroy`:

```ts
export class JobService implements OnModuleDestroy {
  private worker = new Worker("queue", async () => { /* ... */ });

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `closeMethodNames` | `string[]` | `["close", "shutdown", "dispose", "onModuleDestroy"]` | Method names that count as a close-equivalent. |

## Detection

A class "owns" a Worker if either:

- A `PropertyDefinition` is initialized to `new Worker(...)` (`private worker = new Worker(...)`).
- A method body assigns `this.<x> = new Worker(...)` (typically the constructor).

Local-variable workers inside a method body (not assigned to `this`) don't count — they don't outlive the method call.

## Limitations

- Single-class scope. A base class declaring `close()` in another file won't be seen.
- Workers passed in via constructor injection (`constructor(private worker: Worker)`) aren't flagged here — the class doesn't *create* the worker; ownership lives at the call site.

## Autofix

No.

## Version added

0.1.0
