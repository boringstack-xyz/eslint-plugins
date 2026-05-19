import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "query-keys-must-be-constant";

export interface QueryKeysMustBeConstantOptions {
  readonly keyHookNames?: readonly string[];
  readonly clientMethodNames?: readonly string[];
}

type RuleOptions = [QueryKeysMustBeConstantOptions];
type MessageIds = "nonConstantQueryKey";

const DEFAULT_HOOKS = [
  "useQuery",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "useMutation",
  "useQueries"
];

const DEFAULT_METHODS = [
  "invalidateQueries",
  "setQueryData",
  "removeQueries",
  "getQueryData",
  "prefetchQuery"
];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    keyHookNames: {
      type: "array",
      items: { type: "string" }
    },
    clientMethodNames: {
      type: "array",
      items: { type: "string" }
    }
  }
};

function getCalleeIdentifier(
  callee: TSESTree.Expression
): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    if (callee.property.type === AST_NODE_TYPES.Identifier) {
      return callee.property.name;
    }
  }
  return null;
}

export const queryKeysMustBeConstantRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that queryKey is a constant, not an inline array"
    },
    schema: [optionSchema],
    messages: {
      nonConstantQueryKey:
        "queryKey must be a constant — define it in *.constants.ts (e.g. AUTH_QUERY_KEYS.me) rather than inlining the array."
    }
  },
  defaultOptions: [
    {
      keyHookNames: [],
      clientMethodNames: []
    }
  ],
  create(context, [options]) {
    const allHooks = new Set([
      ...DEFAULT_HOOKS,
      ...(options.keyHookNames ?? [])
    ]);
    const allMethods = new Set([
      ...DEFAULT_METHODS,
      ...(options.clientMethodNames ?? [])
    ]);

    return {
      CallExpression(node: TSESTree.CallExpression) {
        const calleeId = getCalleeIdentifier(node.callee);

        if (!calleeId) return;

        const isHook = allHooks.has(calleeId);
        const isMethod = allMethods.has(calleeId);

        if (!isHook && !isMethod) return;

        // Get the first argument (should be options object)
        const arg = node.arguments[0];
        if (!arg || arg.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        // Look for queryKey or mutationKey property
        const queryKeyProp = arg.properties.find(
          (prop) =>
            prop.type === AST_NODE_TYPES.Property &&
            ((prop.key.type === AST_NODE_TYPES.Identifier &&
              (prop.key.name === "queryKey" ||
                prop.key.name === "mutationKey")) ||
              (prop.key.type === AST_NODE_TYPES.Literal &&
                (prop.key.value === "queryKey" ||
                  prop.key.value === "mutationKey")))
        );

        if (!queryKeyProp || queryKeyProp.type !== AST_NODE_TYPES.Property) {
          return;
        }

        const value = queryKeyProp.value;

        // If it's an ArrayExpression and first element is a string literal, report
        if (value.type === AST_NODE_TYPES.ArrayExpression) {
          const firstElement = value.elements[0];
          if (
            firstElement &&
            firstElement.type === AST_NODE_TYPES.Literal &&
            typeof firstElement.value === "string"
          ) {
            context.report({
              node: value,
              messageId: "nonConstantQueryKey"
            });
          }
        }
      }
    };
  }
});
