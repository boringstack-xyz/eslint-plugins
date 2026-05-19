import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "no-direct-error-throw";

export type NoDirectErrorThrowScope = "elysia-only" | "all";

export interface NoDirectErrorThrowOptions {
  readonly forbiddenCtors?: readonly string[];
  readonly factoryName?: string;
  readonly factoryMethod?: string;
  /**
   * `all` (default): fire on every `throw new Error(...)` in the project.
   * The rule's whole point is project-wide discipline — every error path
   * goes through the configured factory.
   *
   * `elysia-only`: opt-in narrower scope. Only fires inside files that
   * import from `elysia` / `@elysiajs/*`. Useful when you have library
   * code that legitimately throws plain `Error` (e.g. shared with non-
   * Elysia consumers) and lets the service layer translate it.
   *
   * Exempt tests/scripts via per-file ESLint overrides instead of
   * narrowing the rule globally — that's the canonical exemption point.
   */
  readonly scope?: NoDirectErrorThrowScope;
}

type RuleOptions = [NoDirectErrorThrowOptions];
type MessageIds = "directThrow";

const DEFAULT_FORBIDDEN_CTORS = ["Error", "TypeError"] as const;
const DEFAULT_FACTORY_NAME = "ApiErrors";
const DEFAULT_FACTORY_METHOD = "internal";
const DEFAULT_SCOPE: NoDirectErrorThrowScope = "all";

const ELYSIA_IMPORT_PATTERN = /^(?:elysia|@elysiajs\/.+)$/;

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    forbiddenCtors: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    factoryName: { type: "string", minLength: 1 },
    factoryMethod: { type: "string", minLength: 1 },
    scope: { type: "string", enum: ["elysia-only", "all"] }
  }
};

function importsElysia(program: TSESTree.Program): boolean {
  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }
    const source = statement.source.value;
    if (typeof source === "string" && ELYSIA_IMPORT_PATTERN.test(source)) {
      return true;
    }
  }
  return false;
}

export const noDirectErrorThrowRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `throw new Error(...)` (and configured constructors) inside Elysia handlers; steer to a configured error factory so Elysia's error pipeline carries typed status info.",
      recommended: true
    },
    fixable: "code",
    schema: [optionSchema],
    messages: {
      directThrow:
        "Do not `throw new {{ctor}}(...)` directly — use `{{factory}}.{{method}}(...)` so Elysia's onError handler can map it to a typed response."
    }
  },
  defaultOptions: [
    {
      forbiddenCtors: [...DEFAULT_FORBIDDEN_CTORS],
      factoryName: DEFAULT_FACTORY_NAME,
      factoryMethod: DEFAULT_FACTORY_METHOD,
      scope: DEFAULT_SCOPE
    }
  ],
  create(context, [options]) {
    const forbiddenCtors = new Set(
      options.forbiddenCtors ?? DEFAULT_FORBIDDEN_CTORS
    );
    const factoryName = options.factoryName ?? DEFAULT_FACTORY_NAME;
    const factoryMethod = options.factoryMethod ?? DEFAULT_FACTORY_METHOD;
    const scope = options.scope ?? DEFAULT_SCOPE;

    let inScope = scope === "all";

    return {
      Program(program) {
        if (scope === "elysia-only") {
          inScope = importsElysia(program);
        }
      },
      ThrowStatement(node) {
        if (!inScope) {
          return;
        }

        const argument = node.argument as TSESTree.Node | null;

        if (!argument || argument.type !== AST_NODE_TYPES.NewExpression) {
          return;
        }

        const newExpr = argument as TSESTree.NewExpression;

        if (
          newExpr.callee.type !== AST_NODE_TYPES.Identifier ||
          !forbiddenCtors.has(newExpr.callee.name)
        ) {
          return;
        }

        const ctorName = newExpr.callee.name;
        const fixable =
          newExpr.arguments.length === 1 &&
          newExpr.arguments[0]?.type === AST_NODE_TYPES.Literal &&
          typeof (newExpr.arguments[0] as TSESTree.Literal).value === "string";

        context.report({
          node: newExpr,
          messageId: "directThrow",
          data: {
            ctor: ctorName,
            factory: factoryName,
            method: factoryMethod
          },
          ...(fixable
            ? {
                fix(fixer) {
                  const literal = newExpr.arguments[0] as TSESTree.Literal;
                  const messageSrc = context.sourceCode.getText(literal);
                  return fixer.replaceText(
                    newExpr,
                    `${factoryName}.${factoryMethod}(${messageSrc})`
                  );
                }
              }
            : {})
        });
      }
    };
  }
});
