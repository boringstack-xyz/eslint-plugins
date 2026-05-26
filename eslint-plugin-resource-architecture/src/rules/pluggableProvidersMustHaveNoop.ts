import fs from "node:fs";
import path from "node:path";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { posixRelativeFromCwd, trimTrailingSlash } from "../utils/path";

export const RULE_NAME = "pluggable-providers-must-have-noop";

type MessageIds = "missingNoop";

export interface PluggableProvidersMustHaveNoopOptions {
  readonly libGlob?: string;
  readonly noopFile?: string;
  /**
   * Provider directories to skip. The "noop fallback" pattern only applies
   * to providers the host code calls unconditionally (email, cache, AI).
   * Some pluggable layers — e.g. OAuth — return 404 when not configured
   * instead of falling through to a noop, and don't need (or want) one.
   *
   * Each entry is a posix path relative to project root, ending in
   * `/providers` (e.g. `"src/lib/oauth/providers"`).
   */
  readonly excludeProviderDirs?: readonly string[];
}

type Options = [PluggableProvidersMustHaveNoopOptions?];

export interface IFsAdapter {
  readonly existsSync: (filename: string) => boolean;
  readonly readdirSync: (dir: string) => string[];
}

const defaultFsAdapter: IFsAdapter = {
  existsSync: (filename) =>
    fs.existsSync(
      path.isAbsolute(filename)
        ? filename
        : path.posix.join(process.cwd().replaceAll("\\", "/"), filename)
    ),
  readdirSync: (dir) =>
    fs.readdirSync(
      path.isAbsolute(dir)
        ? dir
        : path.posix.join(process.cwd().replaceAll("\\", "/"), dir)
    )
};

let fsAdapter: IFsAdapter = defaultFsAdapter;

function resetCaches(): void {
  firstFileCache.clear();
  noopExistsCache.clear();
}

export function __setFsAdapterForTests(next: IFsAdapter): void {
  fsAdapter = next;
  resetCaches();
}

export function __resetFsAdapterForTests(): void {
  fsAdapter = defaultFsAdapter;
  resetCaches();
}

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    libGlob: { type: "string" },
    noopFile: { type: "string" },
    excludeProviderDirs: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  }
};

const firstFileCache = new Map<string, string | null>();
const noopExistsCache = new Map<string, boolean>();

function isProvidersDir(relativeDir: string, libGlob: string): boolean {
  const libPrefix = trimTrailingSlash(libGlob);
  return relativeDir.startsWith(`${libPrefix}/`) && relativeDir.endsWith("/providers");
}

function getProvidersDirKey(providersDir: string): string {
  return path.posix.normalize(providersDir);
}

function getFirstProgramFilename(providersDir: string): string | null {
  const key = getProvidersDirKey(providersDir);
  if (firstFileCache.has(key)) {
    return firstFileCache.get(key) ?? null;
  }

  let entries: string[];
  try {
    entries = fsAdapter.readdirSync(providersDir);
  } catch {
    firstFileCache.set(key, null);
    return null;
  }

  const candidates = entries
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .sort((a, b) => a.localeCompare(b));

  const first = candidates[0] ?? null;
  firstFileCache.set(key, first);
  return first;
}

function getNoopExists(providersDir: string, noopFile: string): boolean {
  const key = `${getProvidersDirKey(providersDir)}::${noopFile}`;
  if (noopExistsCache.has(key)) {
    return noopExistsCache.get(key) ?? false;
  }

  const exists = fsAdapter.existsSync(path.posix.join(providersDir, noopFile));
  noopExistsCache.set(key, exists);
  return exists;
}

export const pluggableProvidersMustHaveNoopRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require provider modules to include a noop implementation file for safe defaults.",
    },
    schema: [optionSchema],
    messages: {
      missingNoop:
        "Provider modules must include a '{{noopFile}}' file in '{{providersDir}}'."
    }
  },
  defaultOptions: [{}],
  create(context, [rawOptions]) {
    const libGlob = rawOptions?.libGlob ?? "src/lib";
    const noopFile = rawOptions?.noopFile ?? "noop.ts";
    const excludeDirs = new Set(
      (rawOptions?.excludeProviderDirs ?? []).map((dir) =>
        trimTrailingSlash(dir)
      )
    );

    const filename = context.filename;
    if (!filename || filename === "<input>") {
      return {};
    }

    const relative = posixRelativeFromCwd(filename);
    if (relative.startsWith("..")) {
      return {};
    }

    const relativeDir = path.posix.dirname(relative);
    if (!isProvidersDir(relativeDir, libGlob)) {
      return {};
    }

    if (excludeDirs.has(trimTrailingSlash(relativeDir))) {
      return {};
    }

    return {
      Program(program) {
        const currentBasename = path.posix.basename(relative);

        const firstBasename = getFirstProgramFilename(relativeDir);
        if (!firstBasename) {
          return;
        }
        if (currentBasename !== firstBasename) {
          return;
        }

        if (getNoopExists(relativeDir, noopFile)) {
          return;
        }

        context.report({
          node: program,
          messageId: "missingNoop",
          data: {
            noopFile,
            providersDir: relativeDir
          }
        });
      }
    };
  }
});

