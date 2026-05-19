# test-file-mirrors-source

Every test file must mirror an existing source file.

## Why

After a refactor or rename, it's easy to leave the old `*.test.ts` behind.
The orphaned test still runs, still passes, and gives you misplaced
confidence in code that no longer exists. This rule catches the drift.

## How it works

For files under `testRoot` ending in `testSuffix`, the rule strips the
suffix, prepends `sourceRoot`, appends `.ts`, and checks that the file
exists. If `additionalSourceRoots` are configured, each one is tried as a
fallback.

The filesystem lookup is exposed through `setFileExistsForTesting(fn)` so
test suites for this plugin can stub it.

## Options

```ts
{
  testRoot?: string;                  // default: "tests"
  sourceRoot?: string;                // default: "src"
  testSuffix?: string;                // default: ".test.ts"
  additionalSourceRoots?: string[];   // default: []
}
```

## Examples

With defaults:

| Test file | Expected source | Verdict |
| --- | --- | --- |
| `tests/users/users.service.test.ts` | `src/users/users.service.ts` | valid if exists |
| `tests/users/orphan.test.ts` | `src/users/orphan.ts` | invalid if missing |
| `tests/helpers/db.ts` | — | not under suffix, ignored |

Monorepo-style with `additionalSourceRoots: ["packages/core/src"]`:

| Test file | Sources tried |
| --- | --- |
| `tests/shared/utils.test.ts` | `src/shared/utils.ts`, then `packages/core/src/shared/utils.ts` |
