declare const db: {
  insert: (table: unknown) => { values: (v: unknown) => Promise<void> };
  update: (table: unknown) => { set: (v: unknown) => Promise<void> };
  transaction: (cb: (tx: typeof db) => Promise<void>) => Promise<void>;
};
declare const users: unknown;
declare const profiles: unknown;
declare const stats: unknown;

// multi-write-must-be-transactional: 2 writes outside any transaction
export async function createUserWithProfile(userId: string): Promise<void> {
  await db.insert(users).values({ id: userId });
  await db.insert(profiles).values({ userId });
}

// transaction-uses-tx-not-db: writes use the outer `db` not `tx`
export async function leakyTx(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    void tx;
    await db.insert(users).values({ id: userId });
    await db.update(stats).set({ count: 1 });
  });
}
