# component-folder-structure

Enforce required sibling files in component folders.

## Rationale

React components benefit from a strict folder structure. Each component should have siblings for hooks, types, tests, and stories. This ensures consistency and makes it easy to find related code.

## Incorrect

```tsx
// Button.tsx exists but is missing required siblings
export default function Button() {
  return <button>Click</button>;
}
```

## Correct

```
Button/
├── Button.tsx              // ✓
├── Button.types.ts         // ✓
├── Button.stories.tsx      // ✓
├── Button.test.ts          // ✓
└── index.ts                // ✓
```

## Options

```ts
interface ComponentFolderStructureOptions {
  requiredSiblings?: string[];      // Default: ['<Name>.hooks.ts', '<Name>.types.ts', '<Name>.stories.tsx', '<Name>.test.ts', 'index.ts']
  ignorePaths?: string[];           // Default: ['src/components/ui/', 'tests/', 'e2e/', '.storybook/', 'node_modules']
}
```

## Detection

The rule triggers on `.tsx` files whose filename starts with an uppercase letter and contains a default export. It checks the parent directory for required siblings.

## Limitations

- Sibling files are checked via `fs.existsSync()` — only works in Node.js environments
- Does not validate the content of sibling files
- Ignores paths under `src/components/ui/` by default (for shadcn/ui compatibility)

## Autofix

None — create the missing sibling files manually.

## Version

0.1.0
