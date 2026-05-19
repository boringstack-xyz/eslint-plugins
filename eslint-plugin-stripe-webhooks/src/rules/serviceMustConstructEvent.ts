import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  DEFAULT_CONSTRUCT_EVENT_NAMES,
  analyzeStripeImports,
  isConstructEventCall,
  walkSome,
  type StripeImports
} from "../utils/stripe";

export const RULE_NAME = "service-must-construct-event";

export interface ServiceMustConstructEventOptions {
  readonly verifyMethodPattern?: string;
  readonly constructEventNames?: readonly string[];
}

type RuleOptions = [ServiceMustConstructEventOptions];
type MessageIds = "missingVerifierMethod";

const DEFAULT_VERIFY_METHOD_PATTERN = "^constructWebhookEvent$";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    verifyMethodPattern: { type: "string", minLength: 1 },
    constructEventNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    }
  }
};

export const serviceMustConstructEventRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Stripe-aware classes that contain any `webhook`-named method must also contain a verifier method (default name `constructWebhookEvent`) whose body calls `*.constructEvent(...)`.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      missingVerifierMethod:
        "Class '{{name}}' contains a webhook-handling method but no verifier method matching `{{pattern}}` that calls `*.constructEvent(...)`. Centralize signature verification in one method so handlers can't accidentally skip it."
    }
  },
  defaultOptions: [
    {
      verifyMethodPattern: DEFAULT_VERIFY_METHOD_PATTERN,
      constructEventNames: ["constructEvent"]
    }
  ],
  create(context, [options]) {
    const verifyPattern = compilePattern(
      options.verifyMethodPattern ?? DEFAULT_VERIFY_METHOD_PATTERN
    );
    const constructEventNames = new Set(
      options.constructEventNames ?? DEFAULT_CONSTRUCT_EVENT_NAMES
    );

    let imports: StripeImports = {
      hasStripeImport: false,
      defaultBindings: new Set(),
      namespaceBindings: new Set(),
      cjsBindings: new Set(),
      eventTypeAliases: new Set()
    };

    return {
      Program(program) {
        imports = analyzeStripeImports(program);
      },
      ClassDeclaration(node) {
        if (!imports.hasStripeImport) {
          return;
        }

        if (!verifyPattern) {
          return;
        }

        const methods = collectMethods(node);

        const hasWebhookMethod = methods.some((m) =>
          /webhook/i.test(m.name)
        );

        if (!hasWebhookMethod) {
          return;
        }

        const verifier = methods.find((m) => verifyPattern.test(m.name));

        if (!verifier) {
          context.report({
            node: node.id ?? node,
            messageId: "missingVerifierMethod",
            data: {
              name: node.id?.name ?? "<anonymous>",
              pattern: options.verifyMethodPattern ?? DEFAULT_VERIFY_METHOD_PATTERN
            }
          });
          return;
        }

        if (!methodCallsConstructEvent(verifier.method, constructEventNames)) {
          context.report({
            node: verifier.method.key,
            messageId: "missingVerifierMethod",
            data: {
              name: node.id?.name ?? "<anonymous>",
              pattern: options.verifyMethodPattern ?? DEFAULT_VERIFY_METHOD_PATTERN
            }
          });
        }
      }
    };
  }
});

interface ClassMethod {
  readonly name: string;
  readonly method: TSESTree.MethodDefinition;
}

function collectMethods(cls: TSESTree.ClassDeclaration): ClassMethod[] {
  const out: ClassMethod[] = [];

  for (const member of cls.body.body) {
    if (member.type !== AST_NODE_TYPES.MethodDefinition) {
      continue;
    }

    const name = getMethodName(member);

    if (name) {
      out.push({ name, method: member });
    }
  }

  return out;
}

function getMethodName(method: TSESTree.MethodDefinition): string | null {
  if (method.key.type === AST_NODE_TYPES.Identifier) {
    return method.key.name;
  }

  if (
    method.key.type === AST_NODE_TYPES.Literal &&
    typeof method.key.value === "string"
  ) {
    return method.key.value;
  }

  return null;
}

function methodCallsConstructEvent(
  method: TSESTree.MethodDefinition,
  constructEventNames: ReadonlySet<string>
): boolean {
  if (!method.value.body) {
    return false;
  }

  return walkSome(method.value.body, (n) => {
    if (n.type !== AST_NODE_TYPES.CallExpression) {
      return false;
    }

    return isConstructEventCall(n, constructEventNames);
  });
}

function compilePattern(source: string): RegExp | null {
  try {
    return new RegExp(source);
  } catch {
    return null;
  }
}
