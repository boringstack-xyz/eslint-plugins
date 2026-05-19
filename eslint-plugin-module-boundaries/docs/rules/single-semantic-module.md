# single-semantic-module

Requires each TypeScript module to contain only one semantic category of top-level concern.

This rule performs AST classification. It does not use filenames, suffixes, or naming conventions to decide whether a file is allowed.

## Incorrect

```ts
export interface User {}
export const DEFAULT_USER = {};
```

```ts
export const USER_LIMIT = 5;
export function validateUser() {}
```

## Correct

```ts
export interface User {}
export type UserId = string;
```

```ts
export const USER_ROLE_ADMIN = "admin";
export const USER_ROLE_USER = "user";
```

## Options

```ts
type Options = [{
  allow?: SemanticCategory[][];
  enumCategory?: "enum" | "type";
  debug?: boolean;
  ignoreAmbientDeclarations?: boolean;
  schemaLibraries?: Array<"zod" | "yup" | "valibot">;
  reactComponentDetection?: { enabled?: boolean };
  hookDetection?: {
    enabled?: boolean;
    namePattern?: string;
  };
}];
```
