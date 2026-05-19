import { getErrorMessage } from "./errors";

declare const logger: {
  info: (payload: object, msg?: string) => void;
  error: (payload: object, msg?: string) => void;
};
declare const user: { id: string; email: string };
declare const error: Error;
declare function maskEmailForLogging(s: string): string;

export function emitEvents(): void {
  logger.info({ event: "user.viewed", userId: user.id });
  logger.info({
    event: "user.created",
    userId: user.id,
    email: maskEmailForLogging(user.email)
  });
  logger.error(
    { event: "payment.failed", reason: getErrorMessage(error) },
    "payment failed"
  );
}
