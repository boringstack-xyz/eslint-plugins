# no-historical-comments

Disallow comments that frame code relative to what it **used to do** or to a past incident: `// Codex flagged X`, `// before the fix`, `// after the refactor`, `// we used to`, `// no longer`, `// kept for backwards compat`, `// historically …`, `// Alpine-era workaround`.

## Why

Source comments should describe the **current invariant**. Comments that narrate history — what changed, why a fix was applied, what the code used to be — rot the moment the code changes again. The next refactor leaves a comment that lies about both the past and the present.

History belongs in the **commit message** or **PR description**, where it's pinned to the diff it describes. Git blame surfaces it on demand.

## Incorrect

```ts
// Codex flagged this — we now check the body discriminator.
const ok = body.accessToken !== null;

// Before the fix, this swallowed 401 silently.
if (!response.ok) {
  return null;
}

// After the auth refactor /refresh returns null for anon callers.
const refresh = await performRefresh();

// We used to read the JWT directly from headers.
const token = await readSessionCookie(req);

// Kept for backwards compat with the v0 client.
export const legacyField = derived(state);

// Alpine-era workaround for the missing libc symbol.
const buf = Buffer.from(input);
```

## Correct

Describe what the code does **now**, or the constraint that makes it non-obvious:

```ts
// Refresh succeeds only when the body carries a non-null accessToken
// — anonymous callers get { accessToken: null } and must NOT retry.
const ok = body.accessToken !== null;

// JWT comes from the signed session cookie; never from headers.
const token = await readSessionCookie(req);
```

JSDoc-style block comments (`/** … */`) are not flagged.

## When not to use

If your codebase deliberately preserves history inline (CHANGELOG-style files, migration journals embedded as comments), disable this rule on those paths. For production source code: leave it on.
