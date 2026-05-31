---
"@boring-stack-pkg/eslint-plugin-comment-hygiene": minor
---

Add `no-historical-comments` rule.

Flags source comments that frame code relative to what it used to do or to a past incident — `Codex flagged X`, `before the fix`, `after the refactor`, `we used to`, `no longer`, `kept for backwards compat`, `historically`, `Alpine-era workaround`. Source comments must describe the current invariant; history belongs in the commit message or PR description where it stays pinned to the diff it describes.

Enabled in the `recommended` config.
