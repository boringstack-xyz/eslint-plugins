# eslint-plugin-bullmq

[![CI](https://github.com/agjs/eslint-plugin-bullmq/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-bullmq/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint plugin enforcing operational-safety rules for [BullMQ](https://docs.bullmq.io/) projects.

## Why

BullMQ is fast, durable, and unopinionated — which means most production failure modes live in code patterns that the framework happily accepts. A worker without a close method abandons in-flight jobs on deploy. A worker without a `failed` listener swallows every error silently. A queue without `removeOnComplete` fills Redis. Job retries without `backoff` fire back-to-back. A `concurrency: 0` boots a worker that processes nothing.

These seven rules pin those patterns down at lint time so they fail in PR review instead of on a 3 a.m. page.

## Install

```sh
pnpm add -D eslint-plugin-bullmq @typescript-eslint/parser
```

## Usage (flat config)

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import bullmq from "eslint-plugin-bullmq";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { bullmq },
    rules: bullmq.configs.recommended.rules,
  },
];
```

The recommended preset enables all seven rules at `"error"`.

## Rules

| Rule                                                                                               | Category    | Description                                                                                   |
| -------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| [`worker-must-implement-close`](docs/rules/worker-must-implement-close.md)                         | Lifecycle   | Classes that own a `new Worker(...)` must declare `close()` (or alias) for graceful shutdown. |
| [`worker-must-listen-failed`](docs/rules/worker-must-listen-failed.md)                             | Visibility  | Every Worker must register `.on("failed", ...)` so failures aren't silent.                    |
| [`job-name-must-be-constant`](docs/rules/job-name-must-be-constant.md)                             | Convention  | `<queue>.add(name, ...)` job names must be identifiers, not inline string literals.           |
| [`queue-options-must-set-removeoncomplete`](docs/rules/queue-options-must-set-removeoncomplete.md) | Retention   | `removeOnComplete` must be configured per-call or via `defaultJobOptions`.                    |
| [`queue-options-must-set-removeonfail`](docs/rules/queue-options-must-set-removeonfail.md)         | Retention   | `removeOnFail` must be configured per-call or via `defaultJobOptions`.                        |
| [`job-options-must-set-attempts`](docs/rules/job-options-must-set-attempts.md)                     | Resilience  | `attempts` must be configured; when `attempts > 1`, `backoff` is also required.               |
| [`no-blocking-concurrency-zero`](docs/rules/no-blocking-concurrency-zero.md)                       | Correctness | Disallow `new Worker(..., { concurrency: <numericLiteral ≤ 0> })`.                            |

## Examples

### worker-must-implement-close

```ts
// ❌
export class JobService {
  private worker = new Worker("queue", async () => {});
}

// ✅
export class JobService {
  private worker = new Worker("queue", async () => {});
  async close() {
    await this.worker.close();
  }
}
```

### worker-must-listen-failed

```ts
// ❌
const worker = new Worker("queue", async () => {});

// ✅
const worker = new Worker("queue", async () => {});
worker.on("failed", (job, err) => logger.error({ id: job?.id, err }));
```

### job-options-must-set-attempts

```ts
// ❌
const emailQueue = new Queue("email");
emailQueue.add(SEND_EMAIL, { to: "x" }, {});

// ✅  (queue-level defaults apply to every add())
const emailQueue = new Queue("email", {
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
  },
});
```

For full per-rule docs and ❌/✅ snippets, see [`docs/rules/`](docs/rules/) and the runnable [`examples/`](examples/).

## Operational rationale

Each rule maps to a real production failure mode:

| Rule                                                       | Failure mode it prevents                                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `worker-must-implement-close`                              | Connection leaks on deploy; jobs in flight are abandoned mid-execution.                                     |
| `worker-must-listen-failed`                                | Silent task drops — failures don't show up in logs / metrics / alerts.                                      |
| `job-name-must-be-constant`                                | Drift between producers, workers, and dashboards when a string is renamed in only one place.                |
| `queue-options-must-set-removeoncomplete` / `removeonfail` | Redis OOM as completed/failed jobs accumulate forever.                                                      |
| `job-options-must-set-attempts`                            | No retries on transient failures; or retries that fire so fast they exhaust the budget on identical errors. |
| `no-blocking-concurrency-zero`                             | Worker boots, listens, processes nothing. Often the symptom of a missing config default.                    |

## Limitations of static analysis

- **Cross-file queue/worker tracking is out of scope.** A queue defined in one module and used in another can't have its `defaultJobOptions` consulted from the call site.
- **Queue identification falls back to the `Queue$` name suffix.** A non-BullMQ object whose variable name happens to end in `Queue` will be treated as one. Tighten via `queueNamePattern` if needed.
- **Listeners attached via helpers** (e.g., `attachStandardListeners(worker)`) are invisible to the rule. Subscribe inline.
- **`worker-must-implement-close`** only checks classes — module-level `new Worker(...)` instances need their cleanup wired into `process.on("SIGTERM")` directly (see `examples/valid/standalone-worker.ts`).

## Development

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Release

Tag `v*` locally and push the tag — `.github/workflows/release.yml` runs `pnpm publish --access public` with `NPM_TOKEN`.

## License

MIT.
