# query-keys-must-be-constant

Enforce that `queryKey` and `mutationKey` are constants, not inline arrays.

## Rationale

TanStack Query's queryKey is used for caching, invalidation, and deduplication. Inline arrays cause cache misses and make invalidation brittle. Query keys must be constants defined in a dedicated constants file.

## Incorrect

```tsx
function useTodos() {
  return useQuery({ queryKey: ["todos"] });
}

function useTodoDetail(id: string) {
  return useQuery({ queryKey: ["todos", id] });
}

queryClient.invalidateQueries({ queryKey: ["todos"] });
```

## Correct

```tsx
// todos.constants.ts
export const TODO_QUERY_KEYS = {
  all: ["todos"] as const,
  detail: (id: string) => [...TODO_QUERY_KEYS.all, id] as const
};

// useTodos.ts
function useTodos() {
  return useQuery({ queryKey: TODO_QUERY_KEYS.all });
}

function useTodoDetail(id: string) {
  return useQuery({ queryKey: TODO_QUERY_KEYS.detail(id) });
}

queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEYS.all });
```

## Options

- `keyHookNames`: extra hook names to check (string[], default empty)
- `clientMethodNames`: extra QueryClient methods (string[], default empty)

## Limitations

- Only flags ArrayExpression where first element is a string literal
- Does not check for static const arrays defined inline (those are allowed)

## Autofix

Not available — requires refactoring to move keys to a constants file.

## Version

0.2.0
