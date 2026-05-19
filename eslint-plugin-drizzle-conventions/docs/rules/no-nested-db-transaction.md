# no-nested-db-transaction

Inside a Drizzle transaction callback, forbid invoking the outer `db`'s `.transaction(...)` method. Pass the callback's `tx` parameter through and call `tx.transaction(...)` instead.

## Rationale

A transaction in Drizzle is a *connection-scoped* operation. The callback receives a `tx` handle that's bound to the open transaction's connection. Calling `db.transaction(...)` inside that callback acquires a **separate** connection — your nested operation now races the outer one, the rows you "see" depend on isolation level, and on transaction-pooled drivers (PgBouncer, Supabase pooler, Neon serverless) you'll deadlock or silently fail without an exception making it back to Node.

Drizzle supports nested transactions via savepoints — that's what `tx.transaction(...)` is for. Always thread the `tx` parameter through your service signatures.

## ❌ Incorrect

```ts
async function badNested(db: Database) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({});

    // Wrong: re-enters the global db, opens a new connection
    await db.transaction(async (innerTx) => {
      await innerTx.insert(profiles).values({});
    });
  });
}
```

## ✅ Correct

```ts
async function goodNested(db: Database) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({});

    // Right: tx.transaction(...) opens a savepoint on the same connection
    await tx.transaction(async (innerTx) => {
      await innerTx.insert(profiles).values({});
    });
  });
}
```

The corollary best practice: **service helpers should accept a transaction handle**, not the global `db`.

```ts
async function createUserAndProfile(tx: Transaction, payload: Payload) {
  await tx.insert(users).values(payload.user);
  await tx.insert(profiles).values(payload.profile);
}

async function entryPoint(db: Database, payload: Payload) {
  await db.transaction((tx) => createUserAndProfile(tx, payload));
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transactionMethod` | `string` | `"transaction"` | Method name to monitor. Override only if you've wrapped Drizzle behind a custom client (e.g., `"atomic"`). |

## Limitations

- Cross-function tracking is out of scope. If the outer transaction's callback calls a helper defined in another module, and that helper invokes `db.transaction(...)`, this rule cannot detect the nesting without parser services.
- Receiver matching is identifier-based. Reassigning `db` (`const x = db; await x.transaction(...)`) defeats the check.

## Autofix

No.

## Version added

0.1.0
