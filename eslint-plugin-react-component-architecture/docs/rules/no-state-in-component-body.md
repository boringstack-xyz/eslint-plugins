# no-state-in-component-body

State hooks must be in custom hooks (`.hooks.ts`), not directly in component bodies.

## Rationale

Component bodies should focus on rendering JSX. State management (useState, useReducer, useEffect, etc.) should be isolated in custom hooks for reusability and clarity.

## Incorrect

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useReducer(reducer, []);
  
  return <div>{count}</div>;
}
```

## Correct

```tsx
// Counter.hooks.ts
export function useCounter() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useReducer(reducer, []);
  return { count, setCount, history };
}

// Counter.tsx
function Counter() {
  const { count } = useCounter();
  return <div>{count}</div>;
}
```

## Options

```ts
interface NoStateInComponentBodyOptions {
  allowedHooks?: string[];  // Default: ['useId', 'useTransition', 'useDeferredValue']
}
```

## Detection

The rule detects direct calls to React hooks (useState, useReducer, useEffect, useLayoutEffect, useMemo, useCallback, useRef) inside JSX-returning functions. Exceptions include read-only hooks like useId, useTransition, useDeferredValue.

## Limitations

- Does not detect all state management patterns (only direct hook calls)
- Custom hooks are not flagged (intentional)
- Heuristic — may have false positives in complex patterns

## Autofix

None — extract to custom hook manually.

## Version

0.1.0
