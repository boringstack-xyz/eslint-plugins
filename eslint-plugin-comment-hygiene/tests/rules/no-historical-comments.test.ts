import {
  RULE_NAME,
  noHistoricalCommentsRule
} from "../../src/rules/no-historical-comments";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noHistoricalCommentsRule, {
  valid: [
    // Plain technical prose that names "now" or "legacy" without
    // describing past code state.
    { code: `// Active session cookies are signed with the rotating key.` },
    { code: `// The legacy /v1 route stays mounted for partner integrations.` },
    { code: `// Returns the user record matching the trimmed email.` },
    {
      code: `// Sentry traces sample at 0 so OTel stays the single tracer.`
    },
    // JSDoc is exempt — it describes the API surface, not history.
    {
      code: `/**\n * @param value the user-supplied URL\n */\nfunction f(v: string) { return v; }`
    },
    // Mentioning a concept that happens to contain "fix" but isn't narration.
    { code: `// Fix-rate ticks are debounced at the source.` },
    // "Now" as a real noun (current time semantics).
    { code: `// now() reads the wall clock through the time util.` }
  ],
  invalid: [
    {
      code: `// Codex flagged this — keep it simple.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// Before the fix, this swallowed the 401 silently.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// After the fix the discriminator branches on error type.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// After the auth refactor /refresh returns null for anon.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// The observability refactor moved Sentry to error-only.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// We used to read the JWT directly from headers.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// This used to be a string; it's now an enum.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// The userId used to be derived from the cookie payload.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// The store no longer caches the membership row.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// Kept for backwards compat with the v0 client.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// Silent fallback was a footgun: misspelled values went unnoticed.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// Historically the API returned the user object inline.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `// Alpine-era workaround for the missing libc symbol.`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `/* Codex flagged this multi-line scenario as a real finding. */`,
      errors: [{ messageId: "historicalComment" }]
    },
    {
      code: `/*\n * The error envelope used to be flat;\n * it now nests under success/error.\n */`,
      errors: [{ messageId: "historicalComment" }]
    }
  ]
});
