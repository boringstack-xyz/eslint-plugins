# transaction-uses-tx-not-db

Inside a `db.transaction(async (tx) => ...)` callback, write calls must use
the `tx` handle, not the outer `db`.

## Why

A `db.insert(...)` inside a transaction callback runs on the *outer*
connection — it doesn't see the transaction, doesn't roll back when the tx
aborts, and silently corrupts state. The classic transaction-leak bug.

The rule scans the body of every `<db>.transaction(<callback>)` for write
calls (`<db>.<method>(...)` where method is in `writeMethods`) and reports
each one.

## Options

```ts
{
  dbNames?: string[];           // default: ["db"]
  writeMethods?: string[];      // default: ["insert", "update", "delete", "upsert", "execute"]
  transactionMethod?: string;   // default: "transaction"
}
```

## Examples

Valid:

```ts
await db.transaction(async (tx) => {
  await tx.insert(users).values({});
  await tx.update(stats).set({ count: 1 });
});
```

Invalid:

```ts
await db.transaction(async (tx) => {
  await db.insert(users).values({});            // outer connection!
});

await db.transaction(async (tx) => {
  await tx.insert(users).values({});
  await db.update(stats).set({ count: 1 });     // not in tx
});
```
