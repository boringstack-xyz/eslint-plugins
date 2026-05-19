# eslint-plugin-elysia

[![CI](https://github.com/agjs/eslint-plugin-elysia/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-elysia/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint plugin enforcing architectural, type-safety, lifecycle, and performance patterns in [Elysia.js](https://elysiajs.com/) applications.

## Why

Elysia is a fluent, chain-based framework whose correctness depends on **registration order**, **plugin naming**, **schema declaration**, and **idiomatic context destructuring**. Most of those constraints aren't expressible in the type system — a missing schema, an unnamed plugin, a hook registered after a route, or a `new Response()` returned where Elysia would have serialized natively all type-check fine and silently misbehave at runtime.

This plugin pins those invariants down at lint time.

## Install

```sh
pnpm add -D eslint-plugin-elysia @typescript-eslint/parser
```

## Usage (flat config)

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import elysia from "eslint-plugin-elysia";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: { elysia },
    rules: elysia.configs.recommended.rules
  }
];
```

The recommended preset enables all twelve rules at `"error"`. Override individual rules as needed:

```js
rules: {
  ...elysia.configs.recommended.rules,
  "elysia/route-requires-tag": "warn",
  "elysia/prefer-static-services": "off",
  "elysia/no-direct-error-throw": [
    "error",
    { factoryName: "HttpErrors", factoryMethod: "make" }
  ]
}
```

## Rules

| Rule | Category | Description |
|------|----------|-------------|
| [`route-requires-schema`](docs/rules/route-requires-schema.md) | Schema | Every route must declare at least one of `body`/`query`/`params`/`response`/`headers`/`cookie`. |
| [`route-requires-tag`](docs/rules/route-requires-tag.md) | Convention | Every route must declare `detail.tags` for Swagger grouping. |
| [`no-direct-error-throw`](docs/rules/no-direct-error-throw.md) | Safety (fixable) | Disallow `throw new Error(...)`; use a typed error factory. |
| [`consistent-status-via-set`](docs/rules/consistent-status-via-set.md) | Convention | Inside route handlers, set status via `set.status = N`, not `new Response(body, { status })`. |
| [`prefer-destructured-context`](docs/rules/prefer-destructured-context.md) | Performance | Don't pass the full Elysia `Context` to controllers/services — destructure at the boundary. |
| [`require-plugin-name`](docs/rules/require-plugin-name.md) | Lifecycle | Exported `new Elysia(...)` instances must declare `{ name: "..." }` for runtime deduplication. |
| [`no-separate-model-interfaces`](docs/rules/no-separate-model-interfaces.md) | Convention | Disallow TS interfaces that duplicate a runtime schema's shape; use `typeof Schema.static` (or equivalent). |
| [`prefer-static-services`](docs/rules/prefer-static-services.md) | Performance | Don't `new Service()` inside route handlers when the class is stateless. |
| [`require-hooks-before-routes`](docs/rules/require-hooks-before-routes.md) | Lifecycle | Global hooks must register before any route on the same instance — Elysia's waterfall is order-sensitive. |
| [`prefer-throw-status`](docs/rules/prefer-throw-status.md) | Convention | Inside route handlers, prefer `throw status(...)` over try/catch building manual responses. |
| [`prefer-direct-return`](docs/rules/prefer-direct-return.md) | Performance | Return values directly; let Elysia serialize. Reserve `new Response(...)` for streams and custom headers. |
| [`no-decorate-state-collision`](docs/rules/no-decorate-state-collision.md) | Safety | Disallow duplicate keys across `.decorate()` / `.state()` / `.derive()` / `.resolve()` on a single instance. |

### route-requires-schema

```ts
// ❌
new Elysia().post("/users", create);

// ✅
new Elysia().post("/users", create, {
  body: t.Object({ email: t.String() }),
  detail: { tags: ["Users"] }
});
```

### require-plugin-name

```ts
// ❌
export const auth = new Elysia();

// ✅
export const auth = new Elysia({ name: "Auth.Plugin" });
```

### require-hooks-before-routes

```ts
// ❌  onError will not fire for /health
new Elysia()
  .get("/health", () => "ok")
  .onError(handleError);

// ✅
new Elysia()
  .onError(handleError)
  .get("/health", () => "ok");
```

### no-decorate-state-collision

```ts
// ❌  silent overwrite — second decorate("db", ...) wins
new Elysia({ name: "db" })
  .decorate("db", a)
  .decorate("db", b);

// ✅
new Elysia({ name: "db" })
  .decorate("db", buildDb())
  .state("requestId", "");
```

For the full list of options and ❌/✅ snippets per rule, see [`docs/rules/`](docs/rules/).

## Design notes

- **AST-only by design.** No `parserServices` / type-checker dependency. Consumers don't need a `parserOptions.project` setup. Rules degrade gracefully where types could give more info — this is documented per-rule under "Limitations."
- **Family-aligned conventions.** Mirrors [`eslint-plugin-module-boundaries`](https://github.com/agjs/eslint-plugin-module-boundaries) and [`eslint-plugin-drizzle-conventions`](https://github.com/agjs/eslint-plugin-drizzle-conventions): same plugin export shape, same `ESLintUtils.RuleCreator` factory, same flat-config preset structure, same kebab-case rule ids.
- **Heuristic rules are explicit.** Rules that can't be made precise without parser services (`prefer-destructured-context`, `no-separate-model-interfaces`, `prefer-static-services`, `prefer-throw-status`) document their limits in the rule docs.

## Development

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Release

Tag a `v*` version locally and push the tag — `.github/workflows/release.yml` runs `pnpm publish --access public` with `NPM_TOKEN`.

## License

MIT.
