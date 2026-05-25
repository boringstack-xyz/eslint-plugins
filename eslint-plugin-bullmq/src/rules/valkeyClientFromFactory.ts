import path from "node:path";

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";
import micromatch from "micromatch";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "valkey-client-from-factory";

export interface ValkeyClientFromFactoryOptions {
  readonly allowedFiles?: readonly string[];
  readonly factoryFunctions?: readonly string[];
}

type RuleOptions = [ValkeyClientFromFactoryOptions];
type MessageIds = "directRedis";

const DEFAULT_ALLOWED_FILES: readonly string[] = [
  "src/clients/valkey/**",
  "tests/**",
  "**/*.test.ts",
];

const DEFAULT_FACTORY_FUNCTIONS: readonly string[] = [
  "getValkeyConnectionOptions",
  "getValkeyAppClientOptions",
];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowedFiles: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
    },
    factoryFunctions: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1,
    },
  },
};

function toPosixRelative(filename: string, cwd: string): string {
  return path.relative(cwd, filename).split(path.sep).join("/");
}

function isFactoryCall(
  node: TSESTree.Node,
  factoryFunctions: ReadonlySet<string>
): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  return factoryFunctions.has(node.callee.name);
}

function firstArgUsesFactory(
  node: TSESTree.NewExpression,
  factoryFunctions: ReadonlySet<string>
): boolean {
  const firstArg = node.arguments[0];

  if (firstArg === undefined) {
    return false;
  }

  if (isFactoryCall(firstArg, factoryFunctions)) {
    return true;
  }

  if (firstArg.type === AST_NODE_TYPES.SpreadElement) {
    return isFactoryCall(firstArg.argument, factoryFunctions);
  }

  if (firstArg.type === AST_NODE_TYPES.ObjectExpression) {
    return firstArg.properties.some((property) => {
      if (property.type !== AST_NODE_TYPES.SpreadElement) {
        return false;
      }

      return isFactoryCall(property.argument, factoryFunctions);
    });
  }

  return false;
}

function isNewRedis(node: TSESTree.NewExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "Redis"
  );
}

export const valkeyClientFromFactoryRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Valkey/ioredis clients must be constructed with options from the shared factory helpers — prevents ad-hoc connection config drift.",
      recommended: true,
    },
    schema: [optionSchema],
    messages: {
      directRedis:
        "Construct Valkey clients with `getValkeyConnectionOptions()` or `getValkeyAppClientOptions()` from `@/clients/valkey` — inline Redis options bypass the shared factory.",
    },
  },
  defaultOptions: [
    {
      allowedFiles: [...DEFAULT_ALLOWED_FILES],
      factoryFunctions: [...DEFAULT_FACTORY_FUNCTIONS],
    },
  ],
  create(context, [options]) {
    const allowedFiles = options.allowedFiles ?? DEFAULT_ALLOWED_FILES;
    const factoryFunctions = new Set(
      options.factoryFunctions ?? DEFAULT_FACTORY_FUNCTIONS
    );
    const relative = toPosixRelative(context.filename, context.cwd);

    if (
      allowedFiles.length > 0 &&
      micromatch.isMatch(relative, [...allowedFiles], { dot: true })
    ) {
      return {};
    }

    return {
      NewExpression(node) {
        if (!isNewRedis(node)) {
          return;
        }

        if (firstArgUsesFactory(node, factoryFunctions)) {
          return;
        }

        context.report({ node, messageId: "directRedis" });
      },
    };
  },
});
