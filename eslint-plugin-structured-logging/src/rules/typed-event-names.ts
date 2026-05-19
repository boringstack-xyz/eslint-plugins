import { readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

import * as parser from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  DEFAULT_LOGGER_METHODS,
  DEFAULT_LOGGER_NAMES,
  getStructuredPayload,
  matchLoggerCall
} from "../utils/logger";

export const RULE_NAME = "typed-event-names";

export interface TypedEventNamesOptions {
  readonly eventNamesModule: string;
  readonly eventNamesExport?: string;
  readonly eventField?: string;
  readonly loggerNames?: readonly string[];
  readonly loggerMethods?: readonly string[];
}

type RuleOptions = [TypedEventNamesOptions];
type MessageIds = "unknownEventName" | "nonLiteralEventValue";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  required: ["eventNamesModule"],
  properties: {
    eventNamesModule: { type: "string", minLength: 1 },
    eventNamesExport: { type: "string", minLength: 1 },
    eventField: { type: "string", minLength: 1 },
    loggerNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    loggerMethods: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    }
  }
};

interface EventCacheEntry {
  readonly events: ReadonlySet<string>;
  readonly mtimeMs: number;
}

const eventNameCache = new Map<string, EventCacheEntry>();

function loadEventNames(
  modulePath: string,
  exportName: string
): ReadonlySet<string> | null {
  let mtimeMs: number;
  try {
    mtimeMs = statSync(modulePath).mtimeMs;
  } catch {
    return null;
  }
  const cached = eventNameCache.get(modulePath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.events;
  }
  let source: string;
  try {
    source = readFileSync(modulePath, "utf8");
  } catch {
    return null;
  }
  const events = extractTupleStringLiterals(source, exportName);
  if (events === null) {
    return null;
  }
  eventNameCache.set(modulePath, { events, mtimeMs });
  return events;
}

function extractTupleStringLiterals(
  source: string,
  exportName: string
): ReadonlySet<string> | null {
  let ast: TSESTree.Program;
  try {
    ast = parser.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      range: false,
      loc: false
    }) as TSESTree.Program;
  } catch {
    return null;
  }
  for (const statement of ast.body) {
    const decl = unwrapExportedVariable(statement, exportName);
    if (decl === null) {
      continue;
    }
    const init = decl.init;
    if (init === null || init === undefined) {
      return null;
    }
    const arrayExpr = unwrapAsConst(init);
    if (arrayExpr === null) {
      return null;
    }
    const out = new Set<string>();
    for (const element of arrayExpr.elements) {
      if (
        element !== null &&
        element.type === AST_NODE_TYPES.Literal &&
        typeof element.value === "string"
      ) {
        out.add(element.value);
      }
    }
    return out;
  }
  return null;
}

function unwrapExportedVariable(
  statement: TSESTree.ProgramStatement,
  exportName: string
): TSESTree.VariableDeclarator | null {
  if (
    statement.type !== AST_NODE_TYPES.ExportNamedDeclaration ||
    statement.declaration === null ||
    statement.declaration === undefined
  ) {
    return null;
  }
  const decl = statement.declaration;
  if (decl.type !== AST_NODE_TYPES.VariableDeclaration) {
    return null;
  }
  for (const declarator of decl.declarations) {
    if (
      declarator.id.type === AST_NODE_TYPES.Identifier &&
      declarator.id.name === exportName
    ) {
      return declarator;
    }
  }
  return null;
}

function unwrapAsConst(
  expr: TSESTree.Expression
): TSESTree.ArrayExpression | null {
  let inner: TSESTree.Expression = expr;
  if (inner.type === AST_NODE_TYPES.TSAsExpression) {
    inner = inner.expression;
  }
  if (inner.type === AST_NODE_TYPES.ArrayExpression) {
    return inner;
  }
  return null;
}

function findEventProperty(
  payload: TSESTree.ObjectExpression,
  field: string
): TSESTree.Property | null {
  for (const prop of payload.properties) {
    if (prop.type !== AST_NODE_TYPES.Property) {
      continue;
    }
    if (
      prop.key.type === AST_NODE_TYPES.Identifier &&
      prop.key.name === field
    ) {
      return prop;
    }
    if (
      prop.key.type === AST_NODE_TYPES.Literal &&
      typeof prop.key.value === "string" &&
      prop.key.value === field
    ) {
      return prop;
    }
  }
  return null;
}

function resolveModulePath(
  configured: string,
  cwd: string,
  filename: string
): string {
  if (isAbsolute(configured)) {
    return configured;
  }
  const cwdResolved = resolve(cwd, configured);
  try {
    statSync(cwdResolved);
    return cwdResolved;
  } catch {
    return resolve(dirname(filename), configured);
  }
}

export const typedEventNamesRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require structured logger `event:` values to be string literals drawn from a project-defined `LOG_EVENTS` const tuple. Catches typos and stale event names at lint time without requiring the TypeScript type checker."
    },
    schema: [optionSchema],
    messages: {
      unknownEventName:
        "Unknown log event '{{value}}'. Add it to {{exportName}} in {{module}} or use an existing event name.",
      nonLiteralEventValue:
        "Logger `{{field}}:` value must be a string literal so it can be cross-checked against {{exportName}}."
    }
  },
  defaultOptions: [
    {
      eventNamesModule: "src/lib/logger/logger.events.ts",
      eventNamesExport: "LOG_EVENTS",
      eventField: "event",
      loggerNames: [...DEFAULT_LOGGER_NAMES],
      loggerMethods: [...DEFAULT_LOGGER_METHODS]
    }
  ],
  create(context, [options]) {
    const exportName = options.eventNamesExport ?? "LOG_EVENTS";
    const eventField = options.eventField ?? "event";
    const loggerNames = new Set(options.loggerNames ?? DEFAULT_LOGGER_NAMES);
    const loggerMethods = new Set(
      options.loggerMethods ?? DEFAULT_LOGGER_METHODS
    );

    const modulePath = resolveModulePath(
      options.eventNamesModule,
      context.cwd,
      context.filename
    );
    const events = loadEventNames(modulePath, exportName);

    return {
      CallExpression(node) {
        if (events === null) {
          return;
        }
        const method = matchLoggerCall(node, loggerNames, loggerMethods);
        if (method === null) {
          return;
        }
        const payload = getStructuredPayload(node);
        if (payload === null) {
          return;
        }
        const eventProp = findEventProperty(payload, eventField);
        if (eventProp === null) {
          return;
        }
        const value = eventProp.value;
        if (
          value.type === AST_NODE_TYPES.Literal &&
          typeof value.value === "string"
        ) {
          if (!events.has(value.value)) {
            context.report({
              node: value,
              messageId: "unknownEventName",
              data: {
                value: value.value,
                exportName,
                module: options.eventNamesModule
              }
            });
          }
          return;
        }
        if (
          value.type === AST_NODE_TYPES.TemplateLiteral &&
          value.expressions.length === 0 &&
          value.quasis.length === 1
        ) {
          const quasi = value.quasis[0];
          const raw = quasi === undefined ? "" : quasi.value.cooked;
          if (!events.has(raw)) {
            context.report({
              node: value,
              messageId: "unknownEventName",
              data: {
                value: raw,
                exportName,
                module: options.eventNamesModule
              }
            });
          }
          return;
        }
        context.report({
          node: value,
          messageId: "nonLiteralEventValue",
          data: { field: eventField, exportName }
        });
      }
    };
  }
});
