import {
  RULE_NAME,
  noNarrationCommentsRule
} from "../../src/rules/no-narration-comments";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noNarrationCommentsRule, {
  valid: [
    { code: `// Locked-down because Stripe replays at-least-once.` },
    { code: `// queue index must mirror the schema order.` },
    { code: `/* The hash is stored at rest; raw token never persists. */` },
    {
      code: `/** @returns the trimmed user input */\nfunction f(x: string) { return x.trim(); }`
    },
    { code: `// here in this branch we already validated above` },
    { code: `// First-class citizen of the pipeline` }
  ],
  invalid: [
    {
      code: `// Here we set up the connection`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `// Now we iterate over each item`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `// First, validate the input`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `// Then we save to disk`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `// Next, we send the email`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `// Finally, return the result`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `// Let's flip the cache here`,
      errors: [{ messageId: "narrationComment" }]
    },
    {
      code: `/* Now we walk the AST */`,
      errors: [{ messageId: "narrationComment" }]
    }
  ]
});
