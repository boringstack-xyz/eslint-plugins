---
"@boring-stack-pkg/eslint-plugin-drizzle-conventions": minor
---

`no-raw-sql-outside-allowlist` allows `sql` templates whose literal text is only arithmetic around interpolated column references, such as `sql\`${links.viewCount} + 1\``, the idiomatic atomic increment. Templates with no holes, string literals in the holes, or any other SQL text are still reported. Disable with the new `allowColumnArithmetic: false` option.
