import path from "node:path";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { hasGlobChars, isAnyMatch, isMatch, posixRelativeFromCwd, toPosixPath } from "../utils/path";

export const RULE_NAME = "concern-import-boundaries";

type MessageIds = "forbiddenImport";

export interface ConcernImportBoundariesOptions {
  readonly framework?: string[];
  readonly orm?: string[];
  readonly dbClientPattern?: string;
}

type Options = [ConcernImportBoundariesOptions?];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    framework: { type: "array", items: { type: "string" } },
    orm: { type: "array", items: { type: "string" } },
    dbClientPattern: { type: "string" }
  }
};

type Concern = "schemas" | "types" | "service" | "routes" | "constants";

function getConcernFromFilename(basename: string): Concern | null {
  if (basename.endsWith(".schemas.ts")) return "schemas";
  if (basename.endsWith(".types.ts")) return "types";
  if (basename.endsWith(".service.ts")) return "service";
  if (basename.endsWith(".routes.ts")) return "routes";
  if (basename.endsWith(".constants.ts")) return "constants";
  return null;
}

function isRelativeImport(source: string): boolean {
  return source.startsWith(".") || source.startsWith("/");
}

function resolveImportToProjectRelative(
  importerRelative: string,
  importSource: string
): string | null {
  if (!isRelativeImport(importSource)) {
    return null;
  }

  const importerDir = path.posix.dirname(importerRelative);
  const resolved = path.posix.normalize(path.posix.join(importerDir, importSource));
  return resolved;
}

function isSchemasFileImport(importSource: string): boolean {
  return importSource.includes(".schemas");
}

function describeForbidden(forbidden: string): string {
  return forbidden;
}

export const concernImportBoundariesRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce concern-based import boundaries (schemas/types/service/routes/constants).",
    },
    schema: [optionSchema],
    messages: {
      forbiddenImport:
        "{{concern}} files must not import {{forbidden}} ({{reason}})."
    }
  },
  defaultOptions: [{}],
  create(context, [rawOptions]) {
    const framework = rawOptions?.framework ?? ["elysia", "@elysiajs/*"];
    const orm = rawOptions?.orm ?? ["drizzle-orm"];
    const dbClientPattern = rawOptions?.dbClientPattern ?? "**/clients/postgres/**";

    const filename = context.getFilename();
    if (!filename || filename === "<input>") {
      return {};
    }

    const relative = posixRelativeFromCwd(filename);
    if (relative.startsWith("..")) {
      return {};
    }

    const basename = path.posix.basename(relative);
    const concern = getConcernFromFilename(basename);
    if (!concern) {
      return {};
    }

    const forbids = {
      schemas: { framework: false, orm: true, db: true, schemas: false },
      types: { framework: true, orm: false, db: false, schemas: true },
      service: { framework: true, orm: false, db: false, schemas: false },
      routes: { framework: false, orm: true, db: true, schemas: false },
      constants: { framework: true, orm: true, db: true, schemas: false }
    } as const;

    const ruleForConcern = forbids[concern];

    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);

        // Framework restrictions
        if (ruleForConcern.framework && isAnyMatch(source, framework)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: {
              concern,
              forbidden: describeForbidden("framework"),
              reason: source
            }
          });
          return;
        }

        // ORM restrictions
        if (ruleForConcern.orm && isAnyMatch(source, orm)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: {
              concern,
              forbidden: describeForbidden("orm"),
              reason: source
            }
          });
          return;
        }

        // schemas import restriction for types
        if (ruleForConcern.schemas && isSchemasFileImport(source)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: {
              concern,
              forbidden: describeForbidden("schemas"),
              reason: source
            }
          });
          return;
        }

        // db client restriction: match either on resolved project-relative path or raw source
        if (ruleForConcern.db) {
          const resolvedProjectRelative = resolveImportToProjectRelative(relative, source);
          const candidate = resolvedProjectRelative ?? source;

          const normalized = toPosixPath(candidate);
          const matchesDb =
            isMatch(normalized, dbClientPattern) ||
            (!hasGlobChars(dbClientPattern) && normalized.includes(dbClientPattern));

          if (matchesDb) {
            context.report({
              node,
              messageId: "forbiddenImport",
              data: {
                concern,
                forbidden: describeForbidden("db client"),
                reason: source
              }
            });
          }
        }
      },
      ExportNamedDeclaration(node) {
        // Catch `export { x } from "..."` re-exports too.
        if (!node.source) {
          return;
        }

        const source = String(node.source.value);
        const importNode = {
          type: AST_NODE_TYPES.ImportDeclaration,
          source: node.source
        } as const;

        // Reuse the same logic by reporting on the export node.
        // We intentionally keep the checks small and duplicated to avoid creating a mini engine.
        if (ruleForConcern.framework && isAnyMatch(source, framework)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: { concern, forbidden: describeForbidden("framework"), reason: source }
          });
          return;
        }

        if (ruleForConcern.orm && isAnyMatch(source, orm)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: { concern, forbidden: describeForbidden("orm"), reason: source }
          });
          return;
        }

        if (ruleForConcern.schemas && isSchemasFileImport(source)) {
          context.report({
            node,
            messageId: "forbiddenImport",
            data: { concern, forbidden: describeForbidden("schemas"), reason: source }
          });
          return;
        }

        if (ruleForConcern.db) {
          const resolvedProjectRelative = resolveImportToProjectRelative(relative, source);
          const candidate = resolvedProjectRelative ?? source;
          const normalized = toPosixPath(candidate);
          const matchesDb =
            isMatch(normalized, dbClientPattern) ||
            (!hasGlobChars(dbClientPattern) && normalized.includes(dbClientPattern));

          if (matchesDb) {
            context.report({
              node,
              messageId: "forbiddenImport",
              data: { concern, forbidden: describeForbidden("db client"), reason: source }
            });
          }
        }

        void importNode;
      }
    };
  }
});

