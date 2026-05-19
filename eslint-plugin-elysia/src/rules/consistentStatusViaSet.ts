import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  collectElysiaVariables,
  findEnclosingRouteHandler,
  findObjectProperty
} from "../utils/elysiaChain";

export const RULE_NAME = "consistent-status-via-set";

export interface ConsistentStatusViaSetOptions {}

type RuleOptions = [ConsistentStatusViaSetOptions];
type MessageIds = "useSetStatus";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {}
};

export const consistentStatusViaSetRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Inside Elysia route handlers, set HTTP status via `set.status = N`, not by returning a `new Response(body, { status: N })`.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      useSetStatus:
        "Do not return `new Response(body, { status })` from an Elysia route handler — assign `set.status = N` and return the body directly."
    }
  },
  defaultOptions: [{}],
  create(context) {
    let elysiaVars = new Set<string>();

    return {
      Program(program) {
        elysiaVars = collectElysiaVariables(program);
      },
      ReturnStatement(node) {
        if (!node.argument || node.argument.type !== AST_NODE_TYPES.NewExpression) {
          return;
        }

        const newExpr = node.argument;

        if (
          newExpr.callee.type !== AST_NODE_TYPES.Identifier ||
          newExpr.callee.name !== "Response"
        ) {
          return;
        }

        const optionsArg = newExpr.arguments[1];

        if (!optionsArg || optionsArg.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        if (!findObjectProperty(optionsArg, "status")) {
          return;
        }

        if (!findEnclosingRouteHandler(node, elysiaVars)) {
          return;
        }

        context.report({ node: newExpr, messageId: "useSetStatus" });
      }
    };
  }
});
