import path from "node:path";

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  importMatchesAny,
  matchesAnyGlob,
  toPosixRelative
} from "../utils/path";

export const RULE_NAME = "no-direct-db-in-tests";

export interface NoDirectDbInTestsOptions {
  readonly testFiles?: readonly string[];
  readonly forbiddenPaths?: readonly string[];
  readonly helpersPath?: string;
}

type RuleOptions = [NoDirectDbInTestsOptions];
type MessageIds = "directDbInTests";

const DEFAULT_TEST_FILES: readonly string[] = [
  "tests/**/*.ts",
  "**/*.test.ts",
  "**/*.spec.ts"
];

const DEFAULT_FORBIDDEN_PATHS: readonly string[] = [
  "**/clients/postgres/**",
  "**/db/**",
  "drizzle-orm"
];

const DEFAULT_HELPERS_PATH = "tests/helpers/db";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    testFiles: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    },
    forbiddenPaths: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    },
    helpersPath: { type: "string", minLength: 1 }
  }
};

function getImportSourceFromDynamic(
  node: TSESTree.ImportExpression
): string | null {
  if (
    node.source.type === AST_NODE_TYPES.Literal &&
    typeof node.source.value === "string"
  ) {
    return node.source.value;
  }
  return null;
}

export const noDirectDbInTestsRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct DB / driver imports from test files — tests must go through the configured helpers entrypoint so connection probing and isolation aren't bypassed."
    },
    schema: [optionSchema],
    messages: {
      directDbInTests:
        "Tests must go through '{{helpers}}'; importing '{{source}}' bypasses connection probing and isolation."
    }
  },
  defaultOptions: [
    {
      testFiles: [...DEFAULT_TEST_FILES],
      forbiddenPaths: [...DEFAULT_FORBIDDEN_PATHS],
      helpersPath: DEFAULT_HELPERS_PATH
    }
  ],
  create(context, [options]) {
    const testFiles = options.testFiles ?? DEFAULT_TEST_FILES;
    const forbiddenPaths = options.forbiddenPaths ?? DEFAULT_FORBIDDEN_PATHS;
    const helpersPath = options.helpersPath ?? DEFAULT_HELPERS_PATH;

    const filename = context.filename;
    const cwd = context.cwd;
    const relative = toPosixRelative(filename, cwd);

    if (!matchesAnyGlob(relative, testFiles)) {
      return {};
    }

    // The helpers file itself is allowed to import from forbidden paths.
    if (
      relative === helpersPath ||
      relative.startsWith(`${helpersPath}/`) ||
      relative === `${helpersPath}.ts` ||
      relative.startsWith(`${helpersPath}/`)
    ) {
      return {};
    }

    const fileDir = path.dirname(relative);

    function resolvesToHelpers(source: string): boolean {
      if (!source.startsWith(".")) {
        return false;
      }
      const resolved = path
        .normalize(path.join(fileDir, source))
        .split(path.sep)
        .join("/");
      const normalizedHelpers = helpersPath.replace(/\.ts$/, "");
      return (
        resolved === normalizedHelpers ||
        resolved.startsWith(`${normalizedHelpers}/`)
      );
    }

    function reportSource(node: TSESTree.Node, source: string): void {
      if (resolvesToHelpers(source)) {
        return;
      }
      if (!importMatchesAny(source, forbiddenPaths)) {
        return;
      }
      context.report({
        node,
        messageId: "directDbInTests",
        data: { helpers: helpersPath, source }
      });
    }

    return {
      ImportDeclaration(node) {
        reportSource(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source !== null) {
          reportSource(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        reportSource(node, node.source.value);
      },
      ImportExpression(node) {
        const source = getImportSourceFromDynamic(node);
        if (source !== null) {
          reportSource(node, source);
        }
      }
    };
  }
});
