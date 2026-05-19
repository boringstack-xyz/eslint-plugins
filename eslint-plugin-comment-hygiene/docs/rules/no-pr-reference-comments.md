# no-pr-reference-comments

Disallow PR / issue references in comments — `#123`, `PR 42`, `see #5`,
`closes #99`, `addresses #1`, and GitHub PR / issue URLs.

## Why

Source files are the wrong place for repo-history metadata. The references
**rot** when:

- The repo is forked / moved / renamed (URLs break).
- The issue tracker migrates (e.g. GitHub → Linear, Jira → Linear).
- An imported issue gets a new number, but the comment still says `#42`.
- Someone reads the code months later and clicks through to a deleted PR.

Repo-history references belong in **commit messages** and **PR descriptions** —
the git log is the canonical, durable place for them. The code itself should
explain the WHY without needing to follow an external link.

## Examples

Invalid:

```ts
// PR #123 introduced this guard
if (user.role !== "admin") throw new ForbiddenError();

// closes #789
const result = await retry(() => fetch(url));

// see #456 for the rationale
const RATE_LIMIT = 100;

// addresses #42 (auth bypass)
function requireOwnership(resource: Resource, userId: string) { ... }

// see https://github.com/foo/bar/pull/12 for context
const SHARDS = 16;

// (see #99)
const MAX_RETRIES = 3;
```

Valid (the WHY captured inline, no repo-history reference):

```ts
// Admin-only because anyone with write access can delete tenant data.
if (user.role !== "admin") throw new ForbiddenError();

// Retry once after backoff — upstream returns 502 on cold-start.
const result = await retry(() => fetch(url));

// Default per-IP per-minute. Edge proxy enforces a higher ceiling.
const RATE_LIMIT = 100;
```

`#dnsteam` and other hashtags that don't lead with digits are not flagged.
GitHub PR / issue URLs (`/pull/<n>`, `/issues/<n>`) are.

## When not to use

If your codebase has a documented convention of inline issue references that
outweighs the rot risk, disable this rule. For most production codebases the
default of "no repo refs in source" is what you want.
