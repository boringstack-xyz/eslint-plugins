# pluggable-providers-must-have-noop

When a module uses a `providers/` directory (default: `src/lib/<module>/providers/`), require a `noop.ts` file to exist in that directory.

## Rationale

Noop providers make dependency injection and feature-flagging safer by ensuring there is always a valid default implementation.

## Examples

✅ Valid:

```txt
src/lib/cache/providers/
  noop.ts
  redis.ts
  memory.ts
```

❌ Invalid:

```txt
src/lib/cache/providers/
  redis.ts
  memory.ts
```

## Options

- `libGlob` (default: `"src/lib"`)
- `noopFile` (default: `"noop.ts"`)

## Autofix

No.

## Version

Added in `0.1.0`.

