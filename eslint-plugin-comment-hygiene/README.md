# eslint-plugin-comment-hygiene

[![CI](https://github.com/agjs/eslint-plugin-comment-hygiene/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agjs/eslint-plugin-comment-hygiene/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

ESLint rules that catch agent-generated comment patterns:

- **`no-narration-comments`** — flags step-by-step prose like
  `// Here we…`, `// Now we…`, `// First, …`, `// Let's …`.
  Describes the sequence of operations a reader can already see;
  a tell that the comment was written by an agent narrating its
  own changes.
- **`no-pr-reference-comments`** — flags PR/issue numbers
  (`#123`, `PR 42`, `see #5`, `closes #99`) and GitHub PR/issue
  URLs. Repo-history references belong in commit messages and PR
  descriptions — they rot when the repo moves or the numbering
  changes.

JSDoc-style block comments (`/** … */`) are exempt from
`no-narration-comments` so descriptions / `@param` / `@returns`
don't false-positive.

## Install

```sh
pnpm add -D eslint-plugin-comment-hygiene
```

Peer deps: `eslint >= 8.57`, `@typescript-eslint/parser >= 8`,
`typescript >= 5`.

## Use (flat config)

```js
import tsParser from "@typescript-eslint/parser";
import commentHygiene from "eslint-plugin-comment-hygiene";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "comment-hygiene": commentHygiene },
    rules: {
      "comment-hygiene/no-narration-comments": "error",
      "comment-hygiene/no-pr-reference-comments": "error"
    }
  }
];
```

Or use the bundled config:

```js
import commentHygiene from "eslint-plugin-comment-hygiene";

export default [commentHygiene.configs.recommended];
```

## Rules

| Rule | Description | Fixable |
| --- | --- | --- |
| [`no-narration-comments`](docs/rules/no-narration-comments.md) | Disallow narrative comments like "Here we…", "Now we…", "First, …", "Let's …" | – |
| [`no-pr-reference-comments`](docs/rules/no-pr-reference-comments.md) | Disallow PR / issue references (`#123`, `PR 42`, GitHub URLs) in comments | – |

## License

MIT.
