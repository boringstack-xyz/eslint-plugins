import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

const STRIPE_PACKAGES = new Set(["stripe", "@stripe/stripe-js"]);

export type FunctionLike =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration;

export interface StripeImports {
  readonly hasStripeImport: boolean;
  readonly defaultBindings: ReadonlySet<string>;
  readonly namespaceBindings: ReadonlySet<string>;
  readonly cjsBindings: ReadonlySet<string>;
  readonly eventTypeAliases: ReadonlySet<string>;
}

export const EMPTY_IMPORTS: StripeImports = {
  hasStripeImport: false,
  defaultBindings: new Set<string>(),
  namespaceBindings: new Set<string>(),
  cjsBindings: new Set<string>(),
  eventTypeAliases: new Set<string>()
};

export function analyzeStripeImports(
  program: TSESTree.Program
): StripeImports {
  const defaultBindings = new Set<string>();
  const namespaceBindings = new Set<string>();
  const cjsBindings = new Set<string>();
  const eventTypeAliases = new Set<string>();
  let hasStripeImport = false;

  for (const stmt of program.body) {
    if (stmt.type === AST_NODE_TYPES.ImportDeclaration) {
      const source = stmt.source.value;

      if (typeof source !== "string" || !STRIPE_PACKAGES.has(source)) {
        continue;
      }

      hasStripeImport = true;

      for (const specifier of stmt.specifiers) {
        if (specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
          defaultBindings.add(specifier.local.name);
          continue;
        }

        if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
          namespaceBindings.add(specifier.local.name);
          continue;
        }

        if (
          specifier.type === AST_NODE_TYPES.ImportSpecifier &&
          specifier.imported.type === AST_NODE_TYPES.Identifier &&
          specifier.imported.name === "Event"
        ) {
          eventTypeAliases.add(specifier.local.name);
        }
      }

      continue;
    }

    if (stmt.type === AST_NODE_TYPES.VariableDeclaration) {
      for (const declarator of stmt.declarations) {
        if (
          declarator.init &&
          declarator.init.type === AST_NODE_TYPES.CallExpression &&
          declarator.init.callee.type === AST_NODE_TYPES.Identifier &&
          declarator.init.callee.name === "require" &&
          declarator.init.arguments[0]?.type === AST_NODE_TYPES.Literal &&
          typeof declarator.init.arguments[0].value === "string" &&
          STRIPE_PACKAGES.has(declarator.init.arguments[0].value)
        ) {
          hasStripeImport = true;

          if (declarator.id.type === AST_NODE_TYPES.Identifier) {
            cjsBindings.add(declarator.id.name);
          }
        }
      }
    }
  }

  return {
    hasStripeImport,
    defaultBindings,
    namespaceBindings,
    cjsBindings,
    eventTypeAliases
  };
}

export function isStripeAwareFile(
  imports: StripeImports
): boolean {
  return imports.hasStripeImport;
}

export function collectStripeInstances(
  program: TSESTree.Program,
  imports: StripeImports
): Set<string> {
  const instances = new Set<string>();
  const ctorNames = new Set<string>([
    ...imports.defaultBindings,
    ...imports.cjsBindings
  ]);

  for (const stmt of program.body) {
    visitForInstances(stmt, ctorNames, imports.namespaceBindings, instances);
  }

  return instances;
}

function visitForInstances(
  node: TSESTree.Node,
  ctorNames: ReadonlySet<string>,
  namespaceBindings: ReadonlySet<string>,
  instances: Set<string>
): void {
  if (node.type === AST_NODE_TYPES.VariableDeclaration) {
    for (const declarator of node.declarations) {
      if (
        declarator.id.type === AST_NODE_TYPES.Identifier &&
        declarator.init &&
        declarator.init.type === AST_NODE_TYPES.NewExpression &&
        isStripeConstructor(
          declarator.init.callee,
          ctorNames,
          namespaceBindings
        )
      ) {
        instances.add(declarator.id.name);
      }
    }

    return;
  }

  if (node.type === AST_NODE_TYPES.ExportNamedDeclaration && node.declaration) {
    visitForInstances(node.declaration, ctorNames, namespaceBindings, instances);
  }
}

function isStripeConstructor(
  callee: TSESTree.Expression | TSESTree.Super,
  ctorNames: ReadonlySet<string>,
  namespaceBindings: ReadonlySet<string>
): boolean {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return ctorNames.has(callee.name);
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    namespaceBindings.has(callee.object.name) &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return true;
  }

  return false;
}

export function getCalleeName(
  call: TSESTree.CallExpression
): string | null {
  return getMemberDotted(call.callee);
}

function getMemberDotted(
  node: TSESTree.Node
): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }

  if (node.type === AST_NODE_TYPES.MemberExpression) {
    if (node.property.type !== AST_NODE_TYPES.Identifier) {
      return null;
    }

    const left = getMemberDotted(node.object);

    if (left === null) {
      return node.property.name;
    }

    return `${left}.${node.property.name}`;
  }

  return null;
}

export function isConstructEventCall(
  call: TSESTree.CallExpression,
  names: ReadonlySet<string> = DEFAULT_CONSTRUCT_EVENT_NAMES
): boolean {
  if (
    call.callee.type !== AST_NODE_TYPES.MemberExpression ||
    call.callee.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  return names.has(call.callee.property.name);
}

export const DEFAULT_CONSTRUCT_EVENT_NAMES: ReadonlySet<string> = new Set([
  "constructEvent"
]);

export interface ParsedBodyKind {
  readonly kind:
    | "request.json"
    | "JSON.parse"
    | "request.body-access"
    | "express.json"
    | "bodyParser.json";
  readonly node: TSESTree.Node;
}

const REQUEST_ALIASES = new Set(["req", "request", "ctx", "c"]);

export function classifyParsedBody(
  node: TSESTree.Node
): ParsedBodyKind | null {
  if (
    node.type === AST_NODE_TYPES.AwaitExpression &&
    node.argument.type === AST_NODE_TYPES.CallExpression
  ) {
    const inner = node.argument;

    if (
      inner.callee.type === AST_NODE_TYPES.MemberExpression &&
      inner.callee.property.type === AST_NODE_TYPES.Identifier &&
      inner.callee.property.name === "json"
    ) {
      return { kind: "request.json", node };
    }
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === "JSON" &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "parse"
  ) {
    return { kind: "JSON.parse", node };
  }

  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    REQUEST_ALIASES.has(node.object.name) &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "body"
  ) {
    return { kind: "request.body-access", node };
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "json"
  ) {
    if (
      node.callee.object.type === AST_NODE_TYPES.Identifier &&
      (node.callee.object.name === "express" ||
        node.callee.object.name === "bodyParser")
    ) {
      const kind: "express.json" | "bodyParser.json" =
        node.callee.object.name === "express" ? "express.json" : "bodyParser.json";
      return { kind, node };
    }
  }

  return null;
}

export function isRawBodyExpression(node: TSESTree.Node): boolean {
  if (
    node.type === AST_NODE_TYPES.AwaitExpression &&
    node.argument.type === AST_NODE_TYPES.CallExpression
  ) {
    const inner = node.argument;

    if (
      inner.callee.type === AST_NODE_TYPES.MemberExpression &&
      inner.callee.property.type === AST_NODE_TYPES.Identifier &&
      (inner.callee.property.name === "text" ||
        inner.callee.property.name === "arrayBuffer" ||
        inner.callee.property.name === "blob")
    ) {
      return true;
    }
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === "Buffer"
  ) {
    return true;
  }

  return false;
}

export function isStripeSignatureHeaderAccess(
  node: TSESTree.Node,
  allowedHeaderNames: ReadonlySet<string>
): boolean {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    if (
      node.computed &&
      node.property.type === AST_NODE_TYPES.Literal &&
      typeof node.property.value === "string" &&
      allowedHeaderNames.has(node.property.value.toLowerCase()) &&
      isHeadersReceiver(node.object)
    ) {
      return true;
    }

    if (
      !node.computed &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      allowedHeaderNames.has(toHyphenCase(node.property.name)) &&
      isHeadersReceiver(node.object)
    ) {
      return true;
    }
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "get" &&
    node.arguments.length >= 1
  ) {
    const arg = node.arguments[0];

    if (
      arg &&
      arg.type === AST_NODE_TYPES.Literal &&
      typeof arg.value === "string" &&
      allowedHeaderNames.has(arg.value.toLowerCase()) &&
      isHeadersReceiver(node.callee.object)
    ) {
      return true;
    }
  }

  return false;
}

function isHeadersReceiver(node: TSESTree.Node): boolean {
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "headers"
  ) {
    return true;
  }

  if (node.type === AST_NODE_TYPES.Identifier && node.name === "headers") {
    return true;
  }

  return false;
}

function toHyphenCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

export function isWhsecLiteral(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.Literal &&
    typeof node.value === "string" &&
    node.value.startsWith("whsec_")
  );
}

export function getEnclosingFunction(node: TSESTree.Node): FunctionLike | null {
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

export function getFunctionDisplayName(fn: FunctionLike): string | null {
  if (
    (fn.type === AST_NODE_TYPES.FunctionDeclaration ||
      fn.type === AST_NODE_TYPES.FunctionExpression) &&
    fn.id
  ) {
    return fn.id.name;
  }

  const parent = fn.parent;

  if (parent) {
    if (
      parent.type === AST_NODE_TYPES.VariableDeclarator &&
      parent.id.type === AST_NODE_TYPES.Identifier
    ) {
      return parent.id.name;
    }

    if (
      parent.type === AST_NODE_TYPES.AssignmentExpression &&
      parent.left.type === AST_NODE_TYPES.Identifier
    ) {
      return parent.left.name;
    }

    if (
      parent.type === AST_NODE_TYPES.Property &&
      parent.key.type === AST_NODE_TYPES.Identifier
    ) {
      return parent.key.name;
    }

    if (
      parent.type === AST_NODE_TYPES.MethodDefinition &&
      parent.key.type === AST_NODE_TYPES.Identifier
    ) {
      return parent.key.name;
    }
  }

  return null;
}

export function looksLikeWebhookHandlerName(name: string | null): boolean {
  if (!name) {
    return false;
  }

  if (/webhook/i.test(name)) {
    return true;
  }

  return name === "POST" || name === "handler";
}

export interface ConstructEventReferenceTracker {
  (call: TSESTree.CallExpression): boolean;
}

export function fileMentionsConstructEvent(
  program: TSESTree.Program,
  names: ReadonlySet<string> = DEFAULT_CONSTRUCT_EVENT_NAMES
): boolean {
  return walkSome(program, (n) => {
    if (
      n.type === AST_NODE_TYPES.CallExpression &&
      n.callee.type === AST_NODE_TYPES.MemberExpression &&
      n.callee.property.type === AST_NODE_TYPES.Identifier &&
      names.has(n.callee.property.name)
    ) {
      return true;
    }

    return false;
  });
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

    for (const [key, value] of Object.entries(
      current as unknown as Record<string, unknown>
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
            stack.push(item);
          }
        }

        continue;
      }

      if (isNodeLike(value)) {
        stack.push(value);
      }
    }
  }

  return false;
}

export function walkCollect(
  root: TSESTree.Node,
  predicate: (n: TSESTree.Node) => boolean
): TSESTree.Node[] {
  const matches: TSESTree.Node[] = [];
  const stack: TSESTree.Node[] = [root];
  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current as object)) {
      continue;
    }

    visited.add(current as object);

    if (predicate(current)) {
      matches.push(current);
    }

    for (const [key, value] of Object.entries(
      current as unknown as Record<string, unknown>
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
            stack.push(item);
          }
        }

        continue;
      }

      if (isNodeLike(value)) {
        stack.push(value);
      }
    }
  }

  return matches;
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
