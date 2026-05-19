declare const ApiErrors: {
  internal(message: string): never;
};

export function fail(): never {
  throw ApiErrors.internal("something broke");
}
