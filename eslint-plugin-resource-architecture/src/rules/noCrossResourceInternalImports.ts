import fs from "node:fs";
import path from "node:path";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  isAnyMatch,
  posixRelativeFromCwd,
  toPosixPath,
  trimTrailingSlash
} from "../utils/path";

export const RULE_NAME = "no-cross-resource-internal-imports";

type MessageIds = "crossResourceInternal";

export interface NoCrossResourceInternalImportsOptions {
  readonly rootGlob?: string;
  readonly publicSurface?: string[];
  /**
   * Resources that every other resource may import freely (e.g. shared
   * foundations like `auth`, `errors`, `config`). Useful for projects
   * where one resource is genuinely cross-cutting.
   */
  readonly globalResources?: string[];
}

type Options = [NoCrossResourceInternalImportsOptions?];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    rootGlob: { type: "string" },
    publicSurface: { type: "array", items: { type: "string" } },
    globalResources: { type: "array", items: { type: "string" } }
  }
};

export interface IFsAdapter {
  readonly existsSync: (filename: string) => boolean;
}

const defaultFsAdapter: IFsAdapter = {
  existsSync: (filename) =>
    fs.existsSync(
      path.isAbsolute(filename)
        ? filename
        : path.posix.join(process.cwd().replaceAll("\\", "/"), filename)
    )
};

let fsAdapter: IFsAdapter = defaultFsAdapter;

export function __setFsAdapterForTests(next: IFsAdapter): void {
  fsAdapter = next;
}

export function __resetFsAdapterForTests(): void {
  fsAdapter = defaultFsAdapter;
}

function getResourceFromRelative(relativeFilename: string, rootGlob: string): string | null {
  const rootPrefix = trimTrailingSlash(toPosixPath(rootGlob));
  const prefixWithSlash = `${rootPrefix}/`;
  if (!relativeFilename.startsWith(prefixWithSlash)) {
    return null;
  }

  const after = relativeFilename.slice(prefixWithSlash.length);
  const parts = after.split("/");
  return parts[0] ?? null;
}

function resolveImportTarget(
  importerRelative: string,
  importSource: string
): string | null {
  if (!importSource.startsWith(".")) {
    return null;
  }

  const importerDir = path.posix.dirname(importerRelative);
  // Keep this project-relative and stable for test stubs. `path.resolve` would
  // produce an absolute path based on `process.cwd()`.
  const base = path.posix.normalize(path.posix.join(importerDir, importSource));

  // Best-effort resolution: prefer explicit extensions, otherwise assume `.ts`.
  // This keeps the rule deterministic in lint runs and avoids relying on FS
  // resolution that varies across tooling/test environments.
  if (base.endsWith(".ts") || base.endsWith(".tsx")) {
    return base;
  }

  if (base.endsWith("/")) {
    return `${base}index.ts`;
  }

  // If the source already looks like a directory import, prefer index.ts.
  if (!base.includes(".")) {
    return `${base}/index.ts`;
  }

  // Most project imports omit the `.ts` extension.
  return `${base}.ts`;
}

export const noCrossResourceInternalImportsRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing internal files across resources; only allow imports of a resource's public surface.",
    },
    schema: [optionSchema],
    messages: {
      crossResourceInternal:
        "Do not import internal files across resources: '{{fromResource}}' → '{{toResource}}' (import '{{importSource}}'). Import the public surface instead."
    }
  },
  defaultOptions: [{}],
  create(context, [rawOptions]) {
    const rootGlob = rawOptions?.rootGlob ?? "src/api";
    // Default public surface includes shared "foundation" file types
    // (types, plugins, roles, schemas, constants). Internal files like
    // `*.service.ts` and `*.utils.ts` remain private to the resource.
    const publicSurface = rawOptions?.publicSurface ?? [
      "index.ts",
      "*.routes.ts",
      "*.types.ts",
      "*.schemas.ts",
      "*.plugin.ts",
      "*.roles.ts",
      "*.constants.ts"
    ];
    const globalResources = new Set(rawOptions?.globalResources ?? []);

    const filename = context.getFilename();
    if (!filename || filename === "<input>") {
      return {};
    }

    const relative = posixRelativeFromCwd(filename);
    if (relative.startsWith("..")) {
      return {};
    }

    const fromResource = getResourceFromRelative(relative, rootGlob);
    if (!fromResource) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const importSource = String(node.source.value);
        const targetRelative = resolveImportTarget(relative, importSource);
        if (!targetRelative) {
          return;
        }

        const toResource = getResourceFromRelative(targetRelative, rootGlob);
        if (!toResource || toResource === fromResource) {
          return;
        }

        if (globalResources.has(toResource)) {
          return;
        }

        const targetBasename = path.posix.basename(targetRelative);
        if (isAnyMatch(targetBasename, publicSurface)) {
          return;
        }

        context.report({
          node,
          messageId: "crossResourceInternal",
          data: {
            fromResource,
            toResource,
            importSource: importSource
          }
        });
      },
      ExportNamedDeclaration(node) {
        if (!node.source) {
          return;
        }

        const importSource = String(node.source.value);
        if (!importSource.startsWith(".")) {
          return;
        }

        const targetRelative = resolveImportTarget(relative, importSource);
        if (!targetRelative) {
          return;
        }

        const toResource = getResourceFromRelative(targetRelative, rootGlob);
        if (!toResource || toResource === fromResource) {
          return;
        }

        if (globalResources.has(toResource)) {
          return;
        }

        const targetBasename = path.posix.basename(targetRelative);
        if (isAnyMatch(targetBasename, publicSurface)) {
          return;
        }

        context.report({
          node,
          messageId: "crossResourceInternal",
          data: {
            fromResource,
            toResource,
            importSource
          }
        });
      }
    };
  }
});

