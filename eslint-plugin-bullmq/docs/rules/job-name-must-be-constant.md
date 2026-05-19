# job-name-must-be-constant

Disallow string-literal job names in `<queue>.add(name, ...)` calls — pass a constant identifier or member access so producers, workers, and dashboards share one source of truth.

## Rationale

A job name is a coupling point between three places:

1. The **producer** that calls `queue.add("send-email", ...)`.
2. The **worker** that switches on `job.name === "send-email"` to dispatch handlers.
3. **Dashboards / observability** that filter logs and metrics by job name.

When the name is an inline string, those three places can drift independently — a typo in the worker silently makes its handler unreachable. Centralize names in a `JOB_NAMES` constant or enum-like object that all three consumers import.

## ❌ Incorrect

```ts
emailQueue.add("send-email", { to: "x" });
emailQueue.add(`literal-template`, {}); // template-literal-without-expressions = same as a literal
```

## ✅ Correct

```ts
const SEND_EMAIL_JOB = "send-email" as const;
emailQueue.add(SEND_EMAIL_JOB, { to: "x" });
```

```ts
const JOB_NAMES = { SendEmail: "send-email", DeleteUser: "delete-user" } as const;
emailQueue.add(JOB_NAMES.SendEmail, {});
```

```ts
// Dynamic name from a variable / function — also accepted (the producer is presumably
// pulling from a registry, not hand-writing strings).
const name: string = computeName();
myQueue.add(name, {});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queueNamePattern` | `string` (regex) | `"Queue$"` | Regex applied to the receiver's identifier name. Used as the fallback heuristic when the rule can't see the queue's `new Queue(...)` definition (e.g., it's imported from another file). |

## Detection

The rule fires only when the receiver of `.add(...)` looks like a queue:

- The receiver is an Identifier matching `queueNamePattern` (default: ends with `Queue`).
- The receiver is `this.<x>` where `<x>` matches `queueNamePattern`.
- The receiver is a known variable from a `new Queue(...)` definition in the same file.

Other `.add(...)` callers (`array.add`, `set.add`) are untouched.

## Limitations

- Cross-file queue tracking is out of scope — receiver identification falls back to the name-suffix heuristic.
- A non-BullMQ object whose variable name happens to end in `Queue` will also trigger this rule. Configure `queueNamePattern` to a stricter regex if that's a problem.

## Autofix

No.

## Version added

0.1.0
