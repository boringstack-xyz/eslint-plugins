import type { TSESTree } from "@typescript-eslint/utils";

/** Keys on AST nodes that never hold child nodes (or would walk upward). */
const NON_AST_KEYS = new Set([
  "parent",
  "loc",
  "range",
  "tokens",
  "comments",
  "start",
  "end",
  "leadingComments",
  "trailingComments",
  "innerComments"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** AST nodes are plain objects with a string `type` discriminant. */
function isNodeLike(value: unknown): value is TSESTree.Node {
  return isRecord(value) && typeof value.type === "string";
}

/** Push every direct child AST node of `node` onto `stack`. */
function pushChildNodes(node: TSESTree.Node, stack: TSESTree.Node[]): void {
  for (const [key, value] of Object.entries(node)) {
    if (NON_AST_KEYS.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNodeLike(child)) {
          stack.push(child);
        }
      }
    } else if (isNodeLike(value)) {
      stack.push(value);
    }
  }
}

/** Depth-first visit of `root` and all descendants (cycle-safe). */
export function walkAll(
  root: TSESTree.Node,
  callback: (node: TSESTree.Node) => void
): void {
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<TSESTree.Node>();

  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    if (visited.has(node)) {
      continue;
    }

    visited.add(node);
    callback(node);
    pushChildNodes(node, stack);
  }
}

/** True if any node in the subtree satisfies `predicate` (cycle-safe). */
export function walkSome(
  root: TSESTree.Node,
  predicate: (node: TSESTree.Node) => boolean
): boolean {
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<TSESTree.Node>();

  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    if (visited.has(node)) {
      continue;
    }

    visited.add(node);

    if (predicate(node)) {
      return true;
    }

    pushChildNodes(node, stack);
  }

  return false;
}
