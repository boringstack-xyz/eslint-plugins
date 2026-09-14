---
"@boring-stack-pkg/eslint-plugin-react-component-architecture": patch
---

`component-folder-structure` no longer demands hooks, types, stories, a test and an index for a `.tsx` file that exports nothing. Such a file is an internal helper of the component beside it (an illustration, a private sub-component split out for length), not a component with a public surface; the full anatomy applies as soon as it gains an `export`.
