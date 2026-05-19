import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  collectElysiaVariables,
  findEnclosingRouteHandler
} from "../utils/elysiaChain";

export const RULE_NAME = "prefer-static-services";

export interface PreferStaticServicesOptions {
  readonly classNamePattern?: string;
}

type RuleOptions = [PreferStaticServicesOptions];
type MessageIds = "preferStaticService";

const DEFAULT_PATTERN = "(Service|Controller|Manager|Repository)$";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    classNamePattern: { type: "string", minLength: 1 }
  }
};

export const preferStaticServicesRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Discourage `new Service()` inside Elysia route handlers when the class is stateless — prefer static methods or a singleton.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      preferStaticService:
        "Avoid `new {{name}}()` inside an Elysia route handler — '{{name}}' has no instance state, so allocating per request is wasteful. Use static methods or a module-level singleton."
    }
  },
  defaultOptions: [{ classNamePattern: DEFAULT_PATTERN }],
  create(context, [options]) {
    const pattern = compilePattern(options.classNamePattern ?? DEFAULT_PATTERN);

    if (!pattern) {
      return {};
    }

    let elysiaVars = new Set<string>();
    const classes = new Map<string, TSESTree.ClassDeclaration>();
    const newExpressions: TSESTree.NewExpression[] = [];

    return {
      Program(program) {
        elysiaVars = collectElysiaVariables(program);
      },
      ClassDeclaration(node) {
        if (node.id) {
          classes.set(node.id.name, node);
        }
      },
      NewExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (!pattern.test(node.callee.name)) {
          return;
        }

        newExpressions.push(node);
      },
      "Program:exit"() {
        for (const newExpr of newExpressions) {
          if (newExpr.callee.type !== AST_NODE_TYPES.Identifier) {
            continue;
          }

          const className = newExpr.callee.name;
          const classDecl = classes.get(className);

          if (!classDecl || !isStateless(classDecl)) {
            continue;
          }

          if (!findEnclosingRouteHandler(newExpr, elysiaVars)) {
            continue;
          }

          context.report({
            node: newExpr,
            messageId: "preferStaticService",
            data: { name: className }
          });
        }
      }
    };
  }
});

function isStateless(node: TSESTree.ClassDeclaration): boolean {
  for (const member of node.body.body) {
    if (
      member.type === AST_NODE_TYPES.PropertyDefinition &&
      member.static !== true
    ) {
      return false;
    }

    if (member.type === AST_NODE_TYPES.MethodDefinition) {
      if (member.kind === "constructor") {
        const ctor = member.value;

        if (
          ctor.body &&
          ctor.body.type === AST_NODE_TYPES.BlockStatement &&
          ctor.body.body.length > 0
        ) {
          return false;
        }

        if (ctor.params.length > 0) {
          for (const param of ctor.params) {
            if (param.type === AST_NODE_TYPES.TSParameterProperty) {
              return false;
            }
          }
        }
      }

      if (
        member.static !== true &&
        member.value.type !== AST_NODE_TYPES.TSEmptyBodyFunctionExpression
      ) {
        if (assignsToThis(member.value)) {
          return false;
        }
      }
    }
  }

  return true;
}

function assignsToThis(fn: TSESTree.FunctionExpression): boolean {
  const stack: TSESTree.Node[] = fn.body ? [fn.body] : [];
  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current as object)) {
      continue;
    }

    visited.add(current as object);

    if (
      current.type === AST_NODE_TYPES.AssignmentExpression &&
      current.left.type === AST_NODE_TYPES.MemberExpression &&
      current.left.object.type === AST_NODE_TYPES.ThisExpression
    ) {
      return true;
    }

    for (const [key, value] of Object.entries(current as unknown as Record<string, unknown>)) {
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

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}

function compilePattern(source: string): RegExp | null {
  try {
    return new RegExp(source);
  } catch {
    return null;
  }
}
