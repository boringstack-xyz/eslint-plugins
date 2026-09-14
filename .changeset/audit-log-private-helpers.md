---
"@boring-stack-pkg/eslint-plugin-audit-log": minor
---

`mutating-service-must-audit` now checks a service's public surface only: module-private functions (not exported) and `private` / `protected` / `#name` class methods are treated as part of the audited method's body, so an `insertDetail` helper called inside an audited `createComponent` transaction no longer needs a second `audit.record`. Exported functions, public methods and properties of service objects are still checked. Set the new `includePrivate: true` option to restore the previous behaviour.
