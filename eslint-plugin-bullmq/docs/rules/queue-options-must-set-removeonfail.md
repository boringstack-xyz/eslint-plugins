# queue-options-must-set-removeonfail

Every `<queue>.add(...)` must configure `removeOnFail` (per-call or via the queue's `defaultJobOptions`) so failed jobs don't accumulate in Redis indefinitely.

## Rationale

Failed jobs are *more* likely to leak than completed ones — debugging usually requires keeping them around long enough to inspect, then dropping. Without `removeOnFail`, every failed job stays forever, and on a queue with persistent failures (a misconfigured downstream, a bad migration) Redis fills up silently.

Use a sensible retention:

- `<number>` → keep the last N for triage.
- `{ age: <seconds>, count: <N> }` → window + cap.
- `false` (explicit) is also accepted by this rule — at least the choice is intentional.

## ❌ Incorrect

```ts
const emailQueue = new Queue("email");

emailQueue.add(NAME, {}, { removeOnComplete: true }); // missing removeOnFail
emailQueue.add(NAME, {});
```

## ✅ Correct

Per-call:

```ts
emailQueue.add(NAME, {}, { removeOnComplete: true, removeOnFail: 1000 });
```

Queue-level default (preferred):

```ts
const emailQueue = new Queue("email", {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 5000
  }
});
```

## Options

None.

## Limitations

Same as [`queue-options-must-set-removeoncomplete`](./queue-options-must-set-removeoncomplete.md). Cross-file queue tracking is out of scope; queue identification falls back to the name-suffix heuristic.

## Autofix

No.

## Version added

0.1.0
