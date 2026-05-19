import fs from "node:fs";
import path from "node:path";

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "env-var-must-have-schema-entry";

export interface EnvVarMustHaveSchemaEntryOptions {
  readonly singletonImportPath?: string;
  readonly singletonName?: string;
  readonly schemaFile?: string;
  readonly schemaPattern?: string;
}

type RuleOptions = [EnvVarMustHaveSchemaEntryOptions];
type MessageIds = "missingSchemaEntry";

const DEFAULT_IMPORT_PATH = "@/config/env";
const DEFAULT_SINGLETON_NAME = "env";
const DEFAULT_SCHEMA_FILE = "src/config/env/schema.ts";
// Matches `KEY:` at the start of an indented line — permissive on purpose.
const DEFAULT_SCHEMA_PATTERN = "^\\s*([A-Z][A-Z0-9_]*)\\s*:";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    singletonImportPath: { type: "string", minLength: 1 },
    singletonName: { type: "string", minLength: 1 },
    schemaFile: { type: "string", minLength: 1 },
    schemaPattern: { type: "string", minLength: 1 }
  }
};

export type SchemaReader = (absolutePath: string) => string | null;

interface SchemaCacheEntry {
  readonly mtimeMs: number;
  readonly keys: ReadonlySet<string>;
}

let schemaReader: SchemaReader = (p) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

let schemaMtime: (absolutePath: string) => number | null = (p) => {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return null;
  }
};

const cache = new Map<string, SchemaCacheEntry>();

export function setSchemaReaderForTesting(
  read: SchemaReader | null,
  mtime?: ((absolutePath: string) => number | null) | null
): void {
  schemaReader =
    read ??
    ((p) => {
      try {
        return fs.readFileSync(p, "utf8");
      } catch {
        return null;
      }
    });
  schemaMtime =
    mtime ??
    ((p) => {
      try {
        return fs.statSync(p).mtimeMs;
      } catch {
        return null;
      }
    });
  cache.clear();
}

function loadSchemaKeys(
  absolutePath: string,
  pattern: RegExp
): ReadonlySet<string> | null {
  const mtime = schemaMtime(absolutePath);
  if (mtime === null) {
    return null;
  }
  const cached = cache.get(absolutePath);
  if (cached !== undefined && cached.mtimeMs === mtime) {
    return cached.keys;
  }
  const text = schemaReader(absolutePath);
  if (text === null) {
    return null;
  }
  const keys = new Set<string>();
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[1] !== undefined) {
      keys.add(match[1]);
    }
  }
  cache.set(absolutePath, { mtimeMs: mtime, keys });
  return keys;
}

export const envVarMustHaveSchemaEntryRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Every `env.X` access must correspond to a key declared in the env schema file. Catches typos before they hit boot."
    },
    schema: [optionSchema],
    messages: {
      missingSchemaEntry:
        "`env.{{key}}` is not declared in {{schemaFile}}. Add it to the schema or fix the typo."
    }
  },
  defaultOptions: [
    {
      singletonImportPath: DEFAULT_IMPORT_PATH,
      singletonName: DEFAULT_SINGLETON_NAME,
      schemaFile: DEFAULT_SCHEMA_FILE,
      schemaPattern: DEFAULT_SCHEMA_PATTERN
    }
  ],
  create(context, [options]) {
    const singletonImportPath =
      options.singletonImportPath ?? DEFAULT_IMPORT_PATH;
    const singletonName = options.singletonName ?? DEFAULT_SINGLETON_NAME;
    const schemaFile = options.schemaFile ?? DEFAULT_SCHEMA_FILE;
    const schemaPattern = new RegExp(
      options.schemaPattern ?? DEFAULT_SCHEMA_PATTERN,
      "gm"
    );

    const absoluteSchemaPath = path.resolve(context.cwd, schemaFile);
    const localBindings = new Set<string>();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== singletonImportPath) {
          return;
        }
        for (const spec of node.specifiers) {
          if (
            spec.type === AST_NODE_TYPES.ImportSpecifier &&
            spec.imported.type === AST_NODE_TYPES.Identifier &&
            spec.imported.name === singletonName
          ) {
            localBindings.add(spec.local.name);
          }
        }
      },
      MemberExpression(node) {
        if (node.computed) {
          return;
        }
        if (
          node.object.type !== AST_NODE_TYPES.Identifier ||
          !localBindings.has(node.object.name)
        ) {
          return;
        }
        if (node.property.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        const keys = loadSchemaKeys(absoluteSchemaPath, schemaPattern);
        if (keys === null) {
          // Schema file unreadable — bail rather than blast every access.
          return;
        }
        const key = node.property.name;
        if (keys.has(key)) {
          return;
        }
        context.report({
          node: node.property,
          messageId: "missingSchemaEntry",
          data: { key, schemaFile }
        });
      }
    };
  }
});
