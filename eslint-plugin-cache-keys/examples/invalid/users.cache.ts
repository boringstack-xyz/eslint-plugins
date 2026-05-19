declare const cacheService: {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, opts?: object) => Promise<void>;
};
declare const id: string;
declare const value: unknown;

export async function loadUser(): Promise<void> {
  // cache-key-must-be-prefixed: "user:" is not a configured prefix
  await cacheService.get(`user:${id}`);

  // cache-set-must-have-ttl: no third argument
  await cacheService.set("cache:user:1", value);

  // cache-set-must-have-ttl: third argument lacks ttlSeconds
  await cacheService.set("cache:user:2", value, { foo: "bar" });
}
