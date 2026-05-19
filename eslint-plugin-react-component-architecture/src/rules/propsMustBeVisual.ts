import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "props-must-be-visual";

export interface PropsMustBeVisualOptions {
  readonly denylist?: readonly string[];
}

type RuleOptions = [PropsMustBeVisualOptions];
type MessageIds = "businessLogicInProps";

const DEFAULT_DENYLIST = [
  "currentUser",
  "isAuthenticated",
  "isUserAuthenticated",
  "authToken",
  "sessionId",
  "apiKey",
  "userId",
  "userRole",
  "hasPermission",
  "userPermissions"
];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    denylist: {
      type: "array",
      items: { type: "string" }
    }
  }
};

const createDenylistRegex = (list: readonly string[]): RegExp => {
  const escaped = list.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = escaped.join("|");
  return new RegExp(`^(${pattern}|.*JWT.*|.*Token.*)$`, "i");
};

export const propsMustBeVisualRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Component props should be visual, not business-logic related"
    },
    schema: [optionSchema],
    messages: {
      businessLogicInProps:
        "Prop '{{name}}' appears to be business logic, not visual state"
    }
  },
  defaultOptions: [{ denylist: DEFAULT_DENYLIST }],
  create(context, [options]) {
    const denylist = options.denylist ?? DEFAULT_DENYLIST;
    const denylistRegex = createDenylistRegex(denylist);

    return {
      "TSInterfaceDeclaration[id.name=/Props$/]"(
        node: TSESTree.TSInterfaceDeclaration
      ) {
        const body = node.body;
        if (body.type !== AST_NODE_TYPES.TSInterfaceBody) {
          return;
        }

        for (const member of body.body) {
          if (member.type === AST_NODE_TYPES.TSPropertySignature) {
            const key = member.key;
            if (
              key.type === AST_NODE_TYPES.Identifier &&
              denylistRegex.test(key.name)
            ) {
              context.report({
                node: key,
                messageId: "businessLogicInProps",
                data: { name: key.name }
              });
            }
          }
        }
      }
    };
  }
});
