import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

const BULLMQ_PACKAGE = "bullmq";

export interface BullmqImports {
  readonly hasBullmqImport: boolean;
  readonly workerLocalNames: ReadonlySet<string>;
  readonly queueLocalNames: ReadonlySet<string>;
  readonly queueEventsLocalNames: ReadonlySet<string>;
}

export const EMPTY_IMPORTS: BullmqImports = {
  hasBullmqImport: false,
  workerLocalNames: new Set<string>(),
  queueLocalNames: new Set<string>(),
  queueEventsLocalNames: new Set<string>()
};

export function analyzeBullmqImports(
  program: TSESTree.Program
): BullmqImports {
  const workerLocalNames = new Set<string>();
  const queueLocalNames = new Set<string>();
  const queueEventsLocalNames = new Set<string>();
  let hasBullmqImport = false;

  for (const stmt of program.body) {
    if (stmt.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }

    if (stmt.source.value !== BULLMQ_PACKAGE) {
      continue;
    }

    hasBullmqImport = true;

    for (const specifier of stmt.specifiers) {
      if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
        continue;
      }

      if (specifier.imported.type !== AST_NODE_TYPES.Identifier) {
        continue;
      }

      switch (specifier.imported.name) {
        case "Worker":
          workerLocalNames.add(specifier.local.name);
          break;
        case "Queue":
          queueLocalNames.add(specifier.local.name);
          break;
        case "QueueEvents":
          queueEventsLocalNames.add(specifier.local.name);
          break;
        default:
          break;
      }
    }
  }

  return {
    hasBullmqImport,
    workerLocalNames,
    queueLocalNames,
    queueEventsLocalNames
  };
}

export function isNewWorker(
  node: TSESTree.Node,
  imports: BullmqImports
): node is TSESTree.NewExpression {
  if (node.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }

  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  if (imports.workerLocalNames.size === 0) {
    return node.callee.name === "Worker";
  }

  return imports.workerLocalNames.has(node.callee.name);
}

export function isNewQueue(
  node: TSESTree.Node,
  imports: BullmqImports
): node is TSESTree.NewExpression {
  if (node.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }

  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  if (imports.queueLocalNames.size === 0) {
    return node.callee.name === "Queue";
  }

  return imports.queueLocalNames.has(node.callee.name);
}

export function isQueueLikeReceiverName(name: string): boolean {
  return /Queue$/.test(name);
}

export function getReceiverKey(node: TSESTree.Node): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }

  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.object.type === AST_NODE_TYPES.ThisExpression &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    return `this.${node.property.name}`;
  }

  return null;
}

export function findEnclosingClass(
  node: TSESTree.Node
): TSESTree.ClassDeclaration | TSESTree.ClassExpression | null {
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    if (
      current.type === AST_NODE_TYPES.ClassDeclaration ||
      current.type === AST_NODE_TYPES.ClassExpression
    ) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

export function findEnclosingFunctionOrClass(
  node: TSESTree.Node
): TSESTree.Node | null {
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.ClassDeclaration ||
      current.type === AST_NODE_TYPES.ClassExpression
    ) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

export function getOptionsObjectArg(
  call: TSESTree.CallExpression | TSESTree.NewExpression,
  index: number
): TSESTree.ObjectExpression | null {
  const arg = call.arguments[index];

  if (arg && arg.type === AST_NODE_TYPES.ObjectExpression) {
    return arg;
  }

  return null;
}

export function findObjectProperty(
  obj: TSESTree.ObjectExpression,
  name: string
): TSESTree.Property | null {
  for (const property of obj.properties) {
    if (property.type !== AST_NODE_TYPES.Property) {
      continue;
    }

    if (
      property.key.type === AST_NODE_TYPES.Identifier &&
      property.key.name === name
    ) {
      return property;
    }

    if (
      property.key.type === AST_NODE_TYPES.Literal &&
      property.key.value === name
    ) {
      return property;
    }
  }

  return null;
}

export interface QueueDefinition {
  readonly node: TSESTree.NewExpression;
  readonly defaultJobOptions: TSESTree.ObjectExpression | null;
}

export function collectQueueDefinitions(
  program: TSESTree.Program,
  imports: BullmqImports
): Map<string, QueueDefinition> {
  const out = new Map<string, QueueDefinition>();

  walkAll(program, (node) => {
    if (!isNewQueue(node, imports)) {
      return;
    }

    const def: QueueDefinition = {
      node,
      defaultJobOptions: extractDefaultJobOptions(node)
    };

    const owner = findOwningBindingKey(node);

    if (owner !== null) {
      out.set(owner, def);
    }
  });

  return out;
}

function extractDefaultJobOptions(
  newExpr: TSESTree.NewExpression
): TSESTree.ObjectExpression | null {
  const opts = getOptionsObjectArg(newExpr, 1);

  if (!opts) {
    return null;
  }

  const property = findObjectProperty(opts, "defaultJobOptions");

  if (!property) {
    return null;
  }

  if (property.value.type === AST_NODE_TYPES.ObjectExpression) {
    return property.value;
  }

  return null;
}

export function findOwningBindingKey(node: TSESTree.Node): string | null {
  const parent = node.parent;

  if (!parent) {
    return null;
  }

  if (
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.id.name;
  }

  if (parent.type === AST_NODE_TYPES.PropertyDefinition) {
    if (parent.key.type === AST_NODE_TYPES.Identifier && !parent.computed) {
      return `this.${parent.key.name}`;
    }

    if (parent.key.type === AST_NODE_TYPES.Literal && typeof parent.key.value === "string") {
      return `this.${parent.key.value}`;
    }
  }

  if (
    parent.type === AST_NODE_TYPES.AssignmentExpression &&
    parent.right === node
  ) {
    const key = getReceiverKey(parent.left);

    if (key) {
      return key;
    }
  }

  return null;
}

export interface WorkerDefinition {
  readonly node: TSESTree.NewExpression;
  readonly bindingKey: string | null;
  readonly enclosingClass: TSESTree.ClassDeclaration | TSESTree.ClassExpression | null;
  readonly enclosingFunctionOrClass: TSESTree.Node | null;
}

export function collectWorkerDefinitions(
  program: TSESTree.Program,
  imports: BullmqImports
): WorkerDefinition[] {
  const out: WorkerDefinition[] = [];

  walkAll(program, (node) => {
    if (!isNewWorker(node, imports)) {
      return;
    }

    out.push({
      node,
      bindingKey: findOwningBindingKey(node),
      enclosingClass: findEnclosingClass(node),
      enclosingFunctionOrClass: findEnclosingFunctionOrClass(node)
    });
  });

  return out;
}

export function isQueueAddCall(
  call: TSESTree.CallExpression
): boolean {
  if (call.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  if (call.callee.property.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  return call.callee.property.name === "add";
}

export function getCallReceiverKey(
  call: TSESTree.CallExpression
): string | null {
  if (call.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }

  return getReceiverKey(call.callee.object);
}

export function walkAll(
  root: TSESTree.Node,
  visit: (n: TSESTree.Node) => void
): void {
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current as object)) {
      continue;
    }

    visited.add(current as object);
    visit(current);

    for (const child of collectChildren(current)) {
      stack.push(child);
    }
  }
}

export function walkSome(
  root: TSESTree.Node,
  predicate: (n: TSESTree.Node) => boolean
): boolean {
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current as object)) {
      continue;
    }

    visited.add(current as object);

    if (predicate(current)) {
      return true;
    }

    for (const child of collectChildren(current)) {
      stack.push(child);
    }
  }

  return false;
}

function collectChildren(node: TSESTree.Node): TSESTree.Node[] {
  const out: TSESTree.Node[] = [];

  for (const [key, value] of Object.entries(
    node as unknown as Record<string, unknown>
  )) {
    if (
      key === "parent" ||
      key === "loc" ||
      key === "range" ||
      key === "tokens" ||
      key === "comments"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNodeLike(item)) {
          out.push(item);
        }
      }

      continue;
    }

    if (isNodeLike(value)) {
      out.push(value);
    }
  }

  return out;
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
