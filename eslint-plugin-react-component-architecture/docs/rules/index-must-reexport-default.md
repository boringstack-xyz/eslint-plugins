# index-must-reexport-default

index.ts in component folders must re-export the component default export.

## Rationale

The index file serves as the public API for the component. It must re-export the component default and optionally types.

## Incorrect

```ts
// index.ts
export * from "./Button.types";
```

## Correct

```ts
// index.ts
export { default as Button } from "./Button";
export * from "./Button.types";
```

## Version

0.1.0
