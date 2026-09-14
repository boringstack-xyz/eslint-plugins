---
"@boring-stack-pkg/eslint-plugin-module-boundaries": minor
---

`single-semantic-module` gains `ignorePrivateDeclarations` (default `false`). When enabled, only exported declarations are classified: a non-exported config object, render helper or private class next to the hook or component that uses it no longer gives the module a second semantic category. Two exported categories still conflict.
