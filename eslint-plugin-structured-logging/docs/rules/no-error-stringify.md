# no-error-stringify

Disallow stringifying errors with `String(error)`, `error.toString()`,
`` `${error}` ``, or `error + ""`.

## Why

Native error stringification produces only the leaf message and drops the
`cause` chain — exactly the information you need when debugging a layered
failure. Use a project-wide extractor (default name: `getErrorMessage`) that
walks the cause chain and produces a structured representation.

This rule reports four patterns:

- `String(error)`
- `error.toString()`
- `` `...${error}...` `` (template-literal expression)
- `error + ""` / `"" + error`

When the configured extractor is already imported in the file, the rule
auto-fixes `String(error)`, `error.toString()`, and `` `${error}` `` to
`getErrorMessage(error)`.

## Options

```ts
{
  errorIdentifierNames?: string[];  // default: ["error", "err", "e", "cause"]
  extractorName?: string;           // default: "getErrorMessage"
}
```

## Examples

Valid:

```ts
import { getErrorMessage } from "./errors";
const m = getErrorMessage(error);
const m = `oops: ${getErrorMessage(error)}`;
const m = String(123);          // not an error identifier
const m = "" + value;           // not an error identifier
```

Invalid:

```ts
const m = String(error);
const m = err.toString();
const m = `oops: ${error}`;
const m = error + "";
```

## When not to use

If your codebase has no central error extractor, install one first; bypassing
this rule directly defeats its purpose.
