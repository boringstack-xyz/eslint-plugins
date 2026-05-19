# prefer-early-return

Prefer guard clauses (early return) over wrapping the function body in a multi-statement `if` without an `else`.

## Incorrect

```ts
async function dispose(): Promise<void> {
  if (ref.client !== null) {
    await ref.client.quit();
    ref.client = null;
  }
}
```

## Correct

```ts
async function dispose(): Promise<void> {
  if (ref.client === null) {
    return;
  }

  await ref.client.quit();
  ref.client = null;
}
```

## When it reports

- The function body is a block.
- The **last** top-level statement is an `if` with no `else`.
- The `if` consequent is a block with **two or more** statements.

## When it does not report

- Single-statement `if` consequents.
- `if` / `else` or `else if` chains.
- An `if` that is not the last statement in the function.
- Expression-bodied arrow functions.

## Suggestions

The rule offers an IDE suggestion (not an auto-fix) that inverts the condition into a guard `return` and hoists the consequent body to the top level.
