# require-event-field

Require structured-logger calls to include an `event` field in their payload.

## Why

Production log search (ELK, Datadog, Loki) is dramatically faster and more
reliable when every log line carries a stable string identifier you can filter
on. `logger.info({ userId })` falls back to substring matching of free-form
messages; `logger.info({ event: "user.created", userId })` lets you query by
field.

This rule reports any call to a configured logger method that does not include
the configured event field in its structured payload.

## Options

```ts
{
  loggerNames?: string[];     // default: ["logger", "log", "reqLogger", "requestLogger"]
  loggerMethods?: string[];   // default: ["fatal", "error", "warn", "info", "debug", "trace"]
  eventField?: string;        // default: "event"
}
```

## Examples

Valid:

```ts
logger.info({ event: "user.created", userId: "u1" });
logger.error({ event: "payment.failed" }, "Payment failed");
logger.debug({ ...sharedContext, userId: "u1" });
```

Invalid:

```ts
logger.info({ userId: "u1" });            // missing event
logger.error({ err }, "boom");            // missing event
logger.warn("just a string message");     // no structured payload at all
```

## When not to use

If your logging convention deliberately uses free-form strings or a different
discriminator field (e.g. `kind`), set `eventField` accordingly.
