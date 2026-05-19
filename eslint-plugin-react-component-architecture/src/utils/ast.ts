import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

/**
 * Detect if a file is a component file (.tsx with uppercase name, not test/story)
 */
export function isComponentFile(filename: string): boolean {
  if (!filename.endsWith(".tsx")) {
    return false;
  }
  if (filename.includes(".test.tsx") || filename.includes(".stories.tsx")) {
    return false;
  }
  const basename = getBasename(filename);
  return /^[A-Z]/.test(basename);
}

/**
 * Detect if a file is a story file
 */
export function isStoryFile(filename: string): boolean {
  return filename.includes(".stories.tsx");
}

/**
 * Detect if a file is a test file
 */
export function isTestFile(filename: string): boolean {
  return filename.includes(".test.ts") || filename.includes(".test.tsx");
}

/**
 * Detect if path is in shadcn/ui components folder
 */
export function isInShadcnUi(filename: string): boolean {
  return filename.includes("/components/ui/");
}

/**
 * Extract component name from filename (e.g., Button.tsx → Button)
 */
export function getComponentName(filename: string): string | null {
  const basename = getBasename(filename);
  const match = basename.match(/^([A-Z][a-zA-Z0-9]*)\.tsx$/);
  return match ? match[1] ?? null : null;
}

/**
 * Check if function is a JSX-returning component
 */
export function isJsxReturningFunction(node: TSESTree.Node): boolean {
  if (
    node.type !== AST_NODE_TYPES.FunctionDeclaration &&
    node.type !== AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  const fnBody = node.body;
  if (!fnBody) {
    return false;
  }

  // Check if it returns JSX
  if (fnBody.type === AST_NODE_TYPES.JSXElement) {
    return true;
  }
  if (fnBody.type === AST_NODE_TYPES.JSXFragment) {
    return true;
  }
  if (fnBody.type === AST_NODE_TYPES.BlockStatement) {
    return containsReturnOfJsx(fnBody);
  }

  return false;
}

/**
 * Check if block contains a return statement with JSX
 */
function containsReturnOfJsx(block: TSESTree.BlockStatement): boolean {
  for (const stmt of block.body) {
    if (stmt.type === AST_NODE_TYPES.ReturnStatement) {
      const arg = stmt.argument;
      if (arg && (arg.type === AST_NODE_TYPES.JSXElement || arg.type === AST_NODE_TYPES.JSXFragment)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get JSX attribute name
 */
export function getJsxAttributeName(node: TSESTree.JSXAttribute): string | null {
  const attr = node.name;
  if (attr.type === AST_NODE_TYPES.JSXIdentifier) {
    return attr.name;
  }
  if (attr.type === AST_NODE_TYPES.JSXNamespacedName) {
    return `${attr.namespace.name}:${attr.name.name}`;
  }
  return null;
}

/**
 * Check if a call is a hook call (e.g., useState)
 */
export function isHookCall(
  node: TSESTree.CallExpression,
  hookName: string
): boolean {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  return node.callee.name === hookName;
}

/**
 * Get the basename without directory
 */
function getBasename(filename: string): string {
  return filename.split("/").pop() ?? "";
}
