import path from "node:path";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  hasGlobChars,
  posixRelativeFromCwd,
  toPosixPath,
  trimTrailingSlash
} from "../utils/path";

export const RULE_NAME = "files-must-be-resource-prefixed";

type MessageIds = "missingResourcePrefix";

export interface FilesMustBeResourcePrefixedOptions {
  readonly rootGlob?: string;
  readonly suffixes?: string[];
  readonly allowExceptions?: string[];
}

type Options = [FilesMustBeResourcePrefixedOptions?];

const DEFAULT_SUFFIXES = [
  "routes",
  "service",
  "schemas",
  "types",
  "utils",
  "constants",
  "plugin"
] as const;

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    rootGlob: { type: "string" },
    suffixes: { type: "array", items: { type: "string" } },
    allowExceptions: { type: "array", items: { type: "string" } }
  }
};

function getStaticPrefix(rootGlob: string): string {
  const cleaned = trimTrailingSlash(toPosixPath(rootGlob));

  if (!hasGlobChars(cleaned)) {
    return cleaned;
  }

  const wildcardIndex = cleaned.search(/[*?[\]{}()!+@]/);
  return wildcardIndex === -1 ? cleaned : trimTrailingSlash(cleaned.slice(0, wildcardIndex));
}

export const filesMustBeResourcePrefixedRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require concern-suffixed files under a resource directory to be prefixed by the resource name."
    },
    schema: [optionSchema],
    messages: {
      missingResourcePrefix:
        "Files under '{{root}}/<resource>/' must be named '<resource>.{{concern}}.ts' (got '{{actual}}')."
    }
  },
  defaultOptions: [{}],
  create(context, [rawOptions]) {
    const rootGlob = rawOptions?.rootGlob ?? "src/api";
    const suffixes = rawOptions?.suffixes ?? [...DEFAULT_SUFFIXES];
    const allowExceptions = rawOptions?.allowExceptions ?? ["index.ts"];

    const filename = context.getFilename();
    if (!filename || filename === "<input>") {
      return {};
    }

    const relative = posixRelativeFromCwd(filename);
    if (relative.startsWith("..")) {
      return {};
    }

    const basename = path.posix.basename(relative);
    if (allowExceptions.includes(basename)) {
      return {};
    }

    if (!basename.endsWith(".ts") || basename.endsWith(".d.ts")) {
      return {};
    }

    const concern = basename.replace(/\.ts$/, "");
    if (!suffixes.includes(concern)) {
      return {};
    }

    const staticPrefix = getStaticPrefix(rootGlob);
    const prefixWithSlash = staticPrefix.length > 0 ? `${staticPrefix}/` : "";

    if (!relative.startsWith(prefixWithSlash)) {
      return {};
    }

    const afterRoot = relative.slice(prefixWithSlash.length);
    const parts = afterRoot.split("/");
    const resource = parts[0];

    if (!resource || parts.length < 2) {
      return {};
    }

    const expected = `${resource}.${concern}.ts`;
    if (basename === expected) {
      return {};
    }

    return {
      Program(program) {
        context.report({
          node: program,
          messageId: "missingResourcePrefix",
          data: {
            root: rootGlob,
            concern,
            actual: basename
          }
        });
      }
    };
  }
});

