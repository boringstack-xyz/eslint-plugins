# eslint-plugin-react-component-architecture

ESLint plugin enforcing React component architecture conventions from [AGENTS.md](https://github.com/DreamData-AI/Programmer-Network-Frontend/blob/main/AGENTS.md).

## Why

React components benefit from enforcing a strict folder structure and separation of concerns. This plugin ensures that:

- Components are properly structured with hooks, types, tests, and stories as siblings
- State management is isolated in custom hooks, not in component bodies
- JSX templates stay minimal and clean (no inline functions or complex logic)
- Props describe visual state only, not business logic
- TypeScript interfaces follow naming conventions
- Imports use consistent patterns (e.g., named imports for React)
- Dark mode classes are removed (light mode only)

## Install

```sh
pnpm add -D eslint-plugin-react-component-architecture @typescript-eslint/parser
```

## Usage (flat config)

```js
// eslint.config.mjs
import tsParser from "@typescript-eslint/parser";
import reactComponentArchitecture from "eslint-plugin-react-component-architecture";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-component-architecture": reactComponentArchitecture },
    rules: reactComponentArchitecture.configs.recommended.rules,
  },
];
```

The recommended preset enables all 15 rules. Most rules are set to `"error"`. Heuristic rules (`no-state-in-component-body`, `no-jsx-computation`, `props-must-be-visual`) default to `"warn"`.

## Rules

| Rule | Type | Description |
|------|------|-------------|
| [`component-folder-structure`](docs/rules/component-folder-structure.md) | Problem | Enforce required sibling files in component folders |
| [`index-must-reexport-default`](docs/rules/index-must-reexport-default.md) | Problem | index.ts must re-export component default export |
| [`no-state-in-component-body`](docs/rules/no-state-in-component-body.md) | Suggestion | Move state hooks to custom hooks (.hooks.ts) |
| [`no-inline-jsx-functions`](docs/rules/no-inline-jsx-functions.md) | Suggestion | Use function references instead of inline functions for handlers |
| [`no-jsx-computation`](docs/rules/no-jsx-computation.md) | Suggestion | Extract complex JSX computations into hooks |
| [`classnames-required`](docs/rules/classnames-required.md) | Suggestion | Use classNames for dynamic className values |
| [`classnames-import-name`](docs/rules/classnames-import-name.md) | Suggestion | Import classnames with correct name |
| [`no-dark-mode-classes`](docs/rules/no-dark-mode-classes.md) | Suggestion | Remove dark: Tailwind classes (light mode only) |
| [`interface-prefix-i`](docs/rules/interface-prefix-i.md) | Suggestion | Interfaces should be prefixed with 'I' |
| [`forwardref-display-name`](docs/rules/forwardref-display-name.md) | Problem | forwardRef components must have displayName |
| [`stories-require-default-export`](docs/rules/stories-require-default-export.md) | Problem | Story files must export Default |
| [`props-must-be-visual`](docs/rules/props-must-be-visual.md) | Suggestion | Props should be visual, not business logic |
| [`react-import-named`](docs/rules/react-import-named.md) | Suggestion | Use named imports from React |
| [`package-json-exact-deps`](docs/rules/package-json-exact-deps.md) | Problem | Enforce exact dependency versions |
| [`github-actions-permissions`](docs/rules/github-actions-permissions.md) | Problem | Enforce permissions and pinned action refs |

## Examples

### no-state-in-component-body

```tsx
// ❌ State in component body
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ✅ State in custom hook
function useCounter() {
  const [count, setCount] = useState(0);
  return { count, setCount };
}

function Counter() {
  const { count } = useCounter();
  return <div>{count}</div>;
}
```

### no-inline-jsx-functions

```tsx
// ❌ Inline function
function Button() {
  return <button onClick={() => alert('clicked')}>Click</button>;
}

// ✅ Named function reference
function Button() {
  const handleClick = () => alert('clicked');
  return <button onClick={handleClick}>Click</button>;
}
```

### classnames-required

```tsx
// ❌ Ternary in className
<button className={isActive ? 'active' : 'inactive'}>Click</button>

// ✅ Use classNames utility
import classNames from 'classnames';
<button className={classNames({ active: isActive })}>Click</button>
```

## Component Folder Structure

Each component should follow this structure:

```
ComponentName/
├── ComponentName.tsx              // Main component
├── ComponentName.types.ts         // TypeScript interfaces
├── ComponentName.hooks.ts         // Custom hooks (if needed)
├── ComponentName.stories.tsx      // Storybook stories
├── ComponentName.test.ts          // Tests
├── ComponentName.utils.ts         // Utilities (optional)
├── ComponentName.constants.ts     // Constants (optional)
└── index.ts                       // Exports
```

The `index.ts` must contain:

```ts
export { default as ComponentName } from "./ComponentName";
export * from "./ComponentName.types";
```

## Notes

- **Rules 14 & 15**: `package-json-exact-deps` and `github-actions-permissions` perform file-content parsing and are best used with appropriate parsers configured in your ESLint setup.
- All rules support configuration options. See individual rule docs for details.
