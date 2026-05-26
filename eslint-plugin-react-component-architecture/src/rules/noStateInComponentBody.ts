import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import { isComponentFile, isJsxReturningFunction, isHookCall, isStoryFile, isTestFile } from "../utils/ast";

export const RULE_NAME = "no-state-in-component-body";

export interface NoStateInComponentBodyOptions {
  readonly allowedHooks?: readonly string[];
}

type RuleOptions = [NoStateInComponentBodyOptions];
type MessageIds = "noStateInComponent";

const REACT_HOOKS = [
  "useState",
  "useReducer",
  "useEffect",
  "useMemo",
  "useCallback",
  "useLayoutEffect",
  "useRef"
];

const DEFAULT_ALLOWED_HOOKS = ["useId", "useTransition", "useDeferredValue"];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allowedHooks: {
      type: "array",
      items: { type: "string" }
    }
  }
};

export const noStateInComponentBodyRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "State hooks must be in .hooks.ts files, not directly in components"
    },
    schema: [optionSchema],
    messages: {
      noStateInComponent:
        "Hook '{{hookName}}' must be in a custom hook (.hooks.ts), not in component body"
    }
  },
  defaultOptions: [{ allowedHooks: DEFAULT_ALLOWED_HOOKS }],
  create(context, [options]) {
    const filename = context.filename;

    if (!isComponentFile(filename)) {
      return {};
    }

    if (isStoryFile(filename) || isTestFile(filename)) {
      return {};
    }

    const allowedHooks = new Set(options.allowedHooks ?? DEFAULT_ALLOWED_HOOKS);

    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const hookName = node.callee.name;

        // Check if it's a React hook
        if (!REACT_HOOKS.includes(hookName)) {
          return;
        }

        // Allow if in allowedHooks list
        if (allowedHooks.has(hookName)) {
          return;
        }

        // Check if we're inside a component
        let parent: TSESTree.Node | undefined = node.parent;
        let inComponent = false;

        while (parent) {
          if (
            (parent.type === AST_NODE_TYPES.FunctionDeclaration ||
              parent.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
            isJsxReturningFunction(parent)
          ) {
            inComponent = true;
            break;
          }
          parent = parent.parent;
        }

        if (inComponent) {
          context.report({
            node,
            messageId: "noStateInComponent",
            data: { hookName }
          });
        }
      }
    };
  }
});
