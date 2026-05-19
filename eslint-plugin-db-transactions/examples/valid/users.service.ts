declare const db: {
  insert: (table: unknown) => { values: (v: unknown) => Promise<void> };
  update: (table: unknown) => { set: (v: unknown) => Promise<void> };
  transaction: (cb: (tx: typeof db) => Promise<void>) => Promise<void>;
};
declare const users: unknown;
declare const profiles: unknown;

export async function createUserWithProfile(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId });
    await tx.insert(profiles).values({ userId });
  });
}

export async function bumpUserSeen(userId: string): Promise<void> {
  await db.update(users).set({ seenAt: new Date(), id: userId });
}
