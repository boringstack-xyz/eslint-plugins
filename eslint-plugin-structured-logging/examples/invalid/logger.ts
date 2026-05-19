declare const logger: {
  info: (payload: object, msg?: string) => void;
  error: (payload: object, msg?: string) => void;
};
declare const user: { id: string; email: string; password: string };
declare const error: Error;

export function emitEvents(): void {
  // require-event-field: missing `event:`
  logger.info({ userId: user.id });

  // mask-pii-fields: unmasked email + password
  logger.info({ event: "user.created", email: user.email, password: user.password });

  // no-error-stringify: stringifying error drops cause chain
  logger.error({ event: "boom", reason: String(error) });
  const msg = `failed: ${error}`;
  void msg;
}
