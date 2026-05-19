import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

export const DEFAULT_CACHE_NAMES: readonly string[] = [
  "cacheService",
  "cache"
];

export interface CacheCallMatch {
  readonly cacheName: string;
  readonly method: string;
}

/**
 * Returns match info when `node` is `<id>.<method>(...)` on a configured
 * cache identifier. Best-effort: identifier-name heuristic, no type info.
 */
export function matchCacheCall(
  node: TSESTree.CallExpression,
  cacheNames: ReadonlySet<string>,
  methods: ReadonlySet<string>
): CacheCallMatch | null {
  const callee = node.callee;
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) {
    return null;
  }
  if (callee.property.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }
  if (!methods.has(callee.property.name)) {
    return null;
  }
  // Walk leftmost — `this.cacheService.set(...)` and `ctx.cache.set(...)`
  // both unwrap to "cacheService" / "cache".
  let receiver: TSESTree.Node = callee.object;
  while (
    receiver.type === AST_NODE_TYPES.MemberExpression &&
    !receiver.computed
  ) {
    if (
      receiver.property.type === AST_NODE_TYPES.Identifier &&
      cacheNames.has(receiver.property.name)
    ) {
      return {
        cacheName: receiver.property.name,
        method: callee.property.name
      };
    }
    receiver = receiver.object;
  }
  if (
    receiver.type === AST_NODE_TYPES.Identifier &&
    cacheNames.has(receiver.name)
  ) {
    return { cacheName: receiver.name, method: callee.property.name };
  }
  return null;
}
