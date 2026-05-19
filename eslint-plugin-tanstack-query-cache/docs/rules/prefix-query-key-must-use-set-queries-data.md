# prefix-query-key-must-use-set-queries-data

When `useQuery` / `useInfiniteQuery` builds a key as `[...somePrefix, extraSegment]`, every cache row is keyed by the full tuple. Calling `setQueryData(somePrefix, …)` or `cancelQueries({ queryKey: somePrefix })` only touches the single entry whose key **equals** `somePrefix`, not the rows for each `extraSegment`.

Use `queryClient.setQueriesData({ queryKey: somePrefix }, …)` (partial match) or supply a predicate so all variants are updated.
