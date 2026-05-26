---
"@boring-stack-pkg/eslint-plugin-react-component-architecture": minor
"@boring-stack-pkg/eslint-plugin-resource-architecture": minor
"@boring-stack-pkg/eslint-plugin-tanstack-query-cache": minor
---

Support ESLint 10.

ESLint 10 removed `context.getFilename()` (deprecated since v9). Switched
all rules in these three plugins to use the `context.filename` property
introduced in ESLint 9.

Peer dependency widened to `^8.57.0 || ^9.0.0 || ^10.0.0`. ESLint 8.x
and 9.x consumers see no behavior change.
