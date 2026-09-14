---
"@boring-stack-pkg/eslint-plugin-module-boundaries": minor
---

`single-semantic-module` gains `ignorePrivateLiteralConstants` (default `false`). When enabled, a non-exported `const` whose initializer is a plain literal (string, number, template, object or array literal, `as const` allowed) no longer counts as a `constant` category, so a hook module may keep the two-line filter object only it reads. Exported constants and computed values still count.
