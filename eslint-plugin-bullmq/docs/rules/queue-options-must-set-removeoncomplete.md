# queue-options-must-set-removeoncomplete

Every `<queue>.add(...)` must configure `removeOnComplete` (per-call or via the queue's `defaultJobOptions`) so completed jobs don't accumulate in Redis indefinitely.

## Rationale

By default, BullMQ keeps every completed job in Redis forever. On a busy queue that's millions of records that grow without bound — Redis OOM, slow scans, expensive backups. Always configure `removeOnComplete`:

- `true` → drop immediately on completion.
- `<number>` → keep the last N (good for dashboards/debugging).
- `{ age: <seconds>, count: <N> }` → keep for a window, capped.

Set this once per queue via `defaultJobOptions`, or on each `add()`.

## ❌ Incorrect

```ts
const emailQueue = new Queue("email");

emailQueue.add(SEND_EMAIL, { to: "x" });
emailQueue.add(SEND_EMAIL, { to: "x" }, {});
```

## ✅ Correct

Per-call:

```ts
emailQueue.add(SEND_EMAIL, { to: "x" }, { removeOnComplete: true });
emailQueue.add(SEND_EMAIL, { to: "x" }, { removeOnComplete: 1000 });
```

Queue-level default (preferred — applies to every `add()`):

```ts
const emailQueue = new Queue("email", {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000
  }
});

emailQueue.add(SEND_EMAIL, { to: "x" }); // inherits defaultJobOptions
```

## Options

None.

## Limitations

- The rule recognizes a queue's `defaultJobOptions` only when the `new Queue(...)` declaration is in the same file as the `.add()` call. Cross-file queue tracking is out of scope.
- Receivers identified solely by the `Queue$` name suffix (without an in-file `new Queue` definition) skip the queue-defaults check and require per-call `removeOnComplete`.

## Autofix

No.

## Version added

0.1.0
