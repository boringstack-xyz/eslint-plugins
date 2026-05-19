# no-narration-comments

Disallow narrative comments that describe the next operation in sequence:
`// Here we…`, `// Now we…`, `// First, …`, `// Then, …`, `// Next, …`,
`// Finally, …`, `// Let's …`, `// Let me …`.

## Why

These comments describe the **sequence** of operations a future reader can
already see in the code on the next line. They add no information and read as
generated prose — usually a tell that the comment was written by an agent
narrating its own changes.

Good comments capture the **WHY** behind a non-obvious decision (a hidden
constraint, a workaround for a known bug, an invariant that isn't enforced by
the type). If a comment can be deleted without losing meaning, delete it.

## Examples

Invalid:

```ts
// Here we set up the connection
const db = connect(env.DATABASE_URL);

// Now we iterate over each item
for (const item of items) { ... }

// First, validate the input
const parsed = schema.parse(body);

// Let's flip the cache here
cache.set(key, value);
```

Valid (WHY-flavored, not narration):

```ts
// Stripe replays at-least-once on 5xx — dedup before processing.
const seen = await dedupTable.has(event.id);

// Indexed in the order columns appear; reorder breaks the index.
const projection = ["id", "createdAt", "status"] as const;
```

JSDoc-style block comments (`/** … */`) are not flagged — descriptions,
`@param`, and `@returns` are not narration in this sense.

## When not to use

If your codebase deliberately uses step-by-step prose comments as part of a
teaching / tutorial repo, disable this rule. For production code: leave it on.
