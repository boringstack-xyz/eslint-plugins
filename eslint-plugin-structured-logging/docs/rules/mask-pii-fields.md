# mask-pii-fields

Disallow unmasked PII (email, phone, password, token, ...) in structured-logger
payloads.

## Why

Logging PII is one of the most common quiet data leaks: a debug line in a
service silently ships email addresses or session tokens into log
aggregation, where they get retained, indexed, and exfiltrated to vendors.
Masking at the log site is the cheapest place to fix this.

This rule flags any property in a logger payload whose key matches a configured
PII field name and whose value is not either a recognized mask literal
(`"[REDACTED]"`, `"***"`, etc.) or a call to a configured masking function
(`maskEmailForLogging(...)`, `redact(...)`, etc.).

## Options

```ts
{
  loggerNames?: string[];     // default: ["logger", "log", "reqLogger", "requestLogger"]
  loggerMethods?: string[];   // default: ["fatal", "error", "warn", "info", "debug", "trace"]
  piiFieldNames?: string[];   // default: ["email", "phone", "password", "token", "apiKey", "secret", "ssn", "creditCard", "authorization"]
  maskFunctions?: string[];   // default: ["maskEmailForLogging", "maskToken", "maskPii", "redact", "mask"]
}
```

## Examples

Valid:

```ts
logger.info({ event: "x", email: maskEmailForLogging(user.email) });
logger.info({ event: "x", token: maskToken(t) });
logger.info({ event: "x", password: "[REDACTED]" });
logger.info({ event: "x", userId: user.id });
```

Invalid:

```ts
logger.info({ event: "x", email: user.email });
logger.error({ event: "x", token: t }, "boom");
logger.warn({ event: "x", password: pwd });
logger.info({ event: "x", apiKey: process.env.STRIPE_KEY });
```

## When not to use

If your logger is wired to a redaction transport (e.g. pino's `redact` config)
that's already removing these fields, this rule is redundant. Prefer source-level
masking anyway — transports are easy to mis-configure.
