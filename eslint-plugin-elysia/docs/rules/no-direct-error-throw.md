# no-direct-error-throw

Disallow `throw new Error(...)` (and configured constructors) — steer to a configured error factory so Elysia's `onError` pipeline carries typed status info.

## Rationale

`throw new Error("...")` produces a stack trace but no HTTP status, no error class, no client-friendly mapping. By the time it reaches `onError`, you've lost the chance to render a typed response. A factory like `ApiErrors.internal(...)` (or your project's equivalent) carries the status code, error code, and serialization contract together.

## ❌ Incorrect

```ts
export function fail(): never {
  throw new Error("Something broke");
}
```

## ✅ Correct

```ts
import { ApiErrors } from "./errors";

export function fail(): never {
  throw ApiErrors.internal("Something broke");
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `forbiddenCtors` | `string[]` | `["Error", "TypeError"]` | Constructor names that trigger the rule. |
| `factoryName` | `string` | `"ApiErrors"` | The factory namespace used in the autofix and message. |
| `factoryMethod` | `string` | `"internal"` | The factory method used in the autofix and message. |

## Autofix

Yes — when the constructor has exactly one string-literal argument:

```ts
throw new Error("nope")
// →
throw ApiErrors.internal("nope")
```

Multi-argument or non-literal forms are flagged but not auto-fixed.

## Version added

0.1.0
