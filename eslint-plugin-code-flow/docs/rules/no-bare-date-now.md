# no-bare-date-now

Disallow direct calls to non-deterministic time/random sources outside an allowlisted set of utility paths: `Date.now()`, `new Date()` (zero-arg), `Date()` (zero-arg), `Math.random()`.

## Why

Direct clock/random reads in business logic make code untestable and undeployable:

- **Snapshot tests** become flaky because `Date.now()` drifts between runs.
- **Workflow replays** (resumable tasks, event sourcing) diverge from the original run.
- **Time-travel debugging** is impossible — there's no seam to swap in a fake clock.
- **Tests** end up wrapping every call site in stubs instead of swapping one util.

Every consumer should route through a typed util (e.g. `now()` from `src/lib/time/now.ts`, a seeded random helper, etc.). That single util is exempted via the `allowedPaths` option.

## Incorrect

```ts
function timestamp(): number {
  return Date.now();
}

function makeId(): string {
  return `id-${Math.random().toString(36).slice(2)}`;
}

function expiresAt(): Date {
  return new Date();
}
```

## Correct

```ts
import { now } from "@/lib/time/now";
import { randomId } from "@/lib/random/id";

function timestamp(): number {
  return now();
}

function makeId(): string {
  return randomId();
}

function expiresAt(): Date {
  return new Date(now()); // explicit argument — pure parser, not a clock read
}
```

Parsing an explicit argument is fine:

```ts
new Date("2026-01-01T00:00:00Z");
new Date(1700000000000);
Date.parse("2026-01-01");
```

## Options

```jsonc
{
  "code-flow/no-bare-date-now": [
    "error",
    {
      // Substring match against the source file's path. Files containing
      // any of these segments are exempted — meant to whitelist the util
      // wrappers themselves.
      "allowedPaths": ["src/lib/time/", "src/lib/random/"]
    }
  ]
}
```

## When not to use

If your codebase deliberately doesn't have determinism requirements (one-off scripts, scratch repos), disable this rule. For production source code: leave it on.
