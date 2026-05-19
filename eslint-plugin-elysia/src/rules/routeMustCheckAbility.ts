import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  collectElysiaVariables,
  getRouteHandlerFunction,
  isElysiaRouteCall
} from "../utils/elysiaChain";

export const RULE_NAME = "route-must-check-ability";

export interface RouteMustCheckAbilityOptions {
  readonly authzCallees?: readonly string[];
  readonly membershipParamName?: string;
}

type RuleOptions = [RouteMustCheckAbilityOptions];
type MessageIds = "missingCheck";

const DEFAULT_AUTHZ_CALLEES = ["requireAbility", "enforceLimit"];
const DEFAULT_MEMBERSHIP_PARAM = "membership";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    authzCallees: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    membershipParamName: { type: "string", minLength: 1 }
  }
};

/**
 * Elysia route handlers that destructure `membership` from their context
 * (i.e. live downstream of a `.derive({ membership })` call that runs
 * `resolveActiveMembership`) MUST perform an authorization check inside
 * the handler. Either:
 *
 *   1. Read `membership.role` (gate by role enum), or
 *   2. Call one of the `authzCallees` (default: `requireAbility(...)`,
 *      `enforceLimit(...)`).
 *
 * Without one of those two, the route is "membership-resolved" but
 * acts on it implicitly — easy to miss, very dangerous on
 * account-scoped resources.
 */
export const routeMustCheckAbilityRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Route handlers that destructure `membership` from context must explicitly authorize — either read `membership.role` or call requireAbility / enforceLimit.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingCheck:
        "This Elysia route destructures `{{paramName}}` but never reads `{{paramName}}.role` or calls one of [{{authzCallees}}]. Add an explicit authorization check — server authorization must NEVER be implicit."
    }
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const membershipParam =
      options.membershipParamName ?? DEFAULT_MEMBERSHIP_PARAM;
    const authzCallees = options.authzCallees ?? DEFAULT_AUTHZ_CALLEES;
    let elysiaVars = new Set<string>();

    return {
      Program(program) {
        elysiaVars = collectElysiaVariables(program);
      },
      CallExpression(node) {
        if (!isElysiaRouteCall(node, elysiaVars)) {
          return;
        }

        const handler = getRouteHandlerFunction(node);

        if (!handler) {
          return;
        }

        if (!handlerDestructuresMembership(handler, membershipParam)) {
          return;
        }

        if (handlerHasAuthzCheck(handler, membershipParam, authzCallees)) {
          return;
        }

        context.report({
          node: handler,
          messageId: "missingCheck",
          data: {
            paramName: membershipParam,
            authzCallees: authzCallees.join(", ")
          }
        });
      }
    };
  }
});

function handlerDestructuresMembership(
  handler:
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
    | TSESTree.FunctionDeclaration,
  membershipParam: string
): boolean {
  const first = handler.params[0];

  if (!first || first.type !== AST_NODE_TYPES.ObjectPattern) {
    return false;
  }

  return first.properties.some(
    (prop) =>
      prop.type === AST_NODE_TYPES.Property &&
      prop.key.type === AST_NODE_TYPES.Identifier &&
      prop.key.name === membershipParam
  );
}

function handlerHasAuthzCheck(
  handler:
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
    | TSESTree.FunctionDeclaration,
  membershipParam: string,
  authzCallees: readonly string[]
): boolean {
  let found = false;

  const visit = (node: TSESTree.Node): void => {
    if (found) {
      return;
    }

    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      node.object.type === AST_NODE_TYPES.Identifier &&
      node.object.name === membershipParam &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      node.property.name === "role"
    ) {
      found = true;

      return;
    }

    if (
      node.type === AST_NODE_TYPES.CallExpression &&
      node.callee.type === AST_NODE_TYPES.Identifier &&
      authzCallees.includes(node.callee.name)
    ) {
      found = true;

      return;
    }

    for (const key of Object.keys(node) as (keyof typeof node)[]) {
      if (key === "parent") {
        continue;
      }

      const value = node[key] as unknown;

      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object" && "type" in child) {
            visit(child as TSESTree.Node);

            if (found) {
              return;
            }
          }
        }
      } else if (value && typeof value === "object" && "type" in value) {
        visit(value as TSESTree.Node);

        if (found) {
          return;
        }
      }
    }
  };

  visit(handler.body);

  return found;
}
