declare const cacheService: {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, opts: { ttlSeconds: number }) => Promise<void>;
};
declare function userCacheKey(id: string): string;
declare const id: string;
declare const value: unknown;

export async function loadUser(): Promise<unknown> {
  const cached = await cacheService.get(userCacheKey(id));
  if (cached !== undefined) {
    return cached;
  }
  await cacheService.set(`cache:user:${id}`, value, { ttlSeconds: 60 });
  return value;
}
