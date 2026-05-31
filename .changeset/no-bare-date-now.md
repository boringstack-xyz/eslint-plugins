---
"@boring-stack-pkg/eslint-plugin-code-flow": minor
---

Add `no-bare-date-now` rule.

Disallows direct calls to non-deterministic time/random sources (`Date.now()`, `new Date()` with no args, `Date()` with no args, `Math.random()`) outside an allowlisted set of utility paths. Determinism is required for snapshot tests, workflow replays, and time-travel debugging — every consumer should route through a typed util that can be faked in tests.

Configurable via the `allowedPaths` option (substring match against the source file path). Enabled in the `recommended` config.
