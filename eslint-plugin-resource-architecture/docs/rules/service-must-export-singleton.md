# service-must-export-singleton

Requires `*.service.ts` files to export both:
- at least one service class, and
- an exported singleton instance constructed from an exported class (E.g. `export const userService = new UserService()`).

## Rationale

In resource-oriented architectures, services are usually long-lived and used as singletons. This rule keeps the convention explicit and consistent.

## Examples

✅ Valid:

```ts
export class UserService {}
export const userService = new UserService();
```

❌ Invalid:

```ts
export class UserService {}
```

## Options

- `singletonNamePattern` (default: `^[a-z][a-zA-Z0-9]*Service$`)

## Autofix

No.

## Version

Added in `0.1.0`.

