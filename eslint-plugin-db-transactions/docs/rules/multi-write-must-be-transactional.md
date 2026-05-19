# multi-write-must-be-transactional

Functions performing two or more DB writes must group them inside a single
`db.transaction(...)` callback.

## Why

Multi-step writes outside a transaction leave you with split-brain on the
first failure: the first row landed, the second didn't, and now you're
chasing data drift in production. Wrapping them in a transaction means
either everything commits or everything rolls back.

The rule also flags the common refactor pitfall: splitting one transaction
into two adjacent ones. That defeats the purpose — failure between them
still leaves a partial state. If you genuinely want multiple small
transactions per function, raise `thresholdWrites` or rename the method
out of `writeMethods`.

## How it works

For each function-like (declarations, expressions, arrow functions), the
rule counts DB write calls (`<db>.<method>(...)` where method is in
`writeMethods`) that are *not* inside a `<db>.transaction(...)` callback.
If the count meets `thresholdWrites`, the function is reported.

Writes inside `db.transaction(async (tx) => ...)` are scoped to that
callback's frame, not the outer function.

## Options

```ts
{
  dbNames?: string[];           // default: ["db"]
  writeMethods?: string[];      // default: ["insert", "update", "delete", "upsert", "execute"]
  transactionMethod?: string;   // default: "transaction"
  thresholdWrites?: number;     // default: 2
}
```

## Examples

Valid:

```ts
async function createOne() {
  await db.insert(users).values({ id: "1" });
}

async function createMany() {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: "1" });
    await tx.insert(profiles).values({ userId: "1" });
  });
}
```

Invalid:

```ts
async function createMany() {
  await db.insert(users).values({ id: "1" });
  await db.insert(profiles).values({ userId: "1" });
}

// Split across two transactions — still flagged.
async function createMany() {
  await db.transaction(async (tx) => { await tx.insert(users).values({}); });
  await db.transaction(async (tx) => { await tx.insert(profiles).values({}); });
  await db.update(stats).set({ count: 1 });
  await db.update(stats).set({ count: 2 });
}
```
