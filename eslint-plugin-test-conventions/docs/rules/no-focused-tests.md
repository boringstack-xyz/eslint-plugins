# no-focused-tests

Disallow focused tests (`test.only`, `it.only`, `describe.only`, `fdescribe`,
`fit`, ...) — the canonical "I forgot to remove this before committing" leak.

## Why

A single `.only` slipped into committed code skips every other test in CI,
and the green pipeline lets the regression slip with it. This rule catches
all the focused-test forms before they merge.

## Patterns flagged

- `test.only(...)`, `it.only(...)`, `describe.only(...)`, `suite.only(...)`
- chained: `describe.skip.only(...)`, `test.each(...).only(...)`
- computed: `test["only"](...)`
- bare aliases: `fdescribe(...)`, `fit(...)`, `fcontext(...)`

`myObj.only(...)` (unrelated method) is **not** flagged — only members
rooted at a configured test global trigger.

## Options

```ts
{
  testGlobals?: string[];     // default: ["test", "it", "describe", "suite"]
  focusedAliases?: string[];  // default: ["fdescribe", "fit", "fcontext"]
}
```

## Examples

Valid:

```ts
test("ok", () => {});
describe("group", () => { it("ok", () => {}); });
test.skip("flaky", () => {});
myObj.only("not a test", () => {});
```

Invalid:

```ts
test.only("focused", () => {});
it.only("focused", () => {});
describe.only("group", () => {});
test["only"]("focused", () => {});
fdescribe("group", () => {});
fit("focused", () => {});
```
