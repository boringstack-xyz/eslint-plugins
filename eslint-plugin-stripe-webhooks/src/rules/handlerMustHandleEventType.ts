import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  analyzeStripeImports,
  walkSome,
  type FunctionLike,
  type StripeImports
} from "../utils/stripe";

export const RULE_NAME = "handler-must-handle-event-type";

export interface HandlerMustHandleEventTypeOptions {
  readonly requireDefaultCase?: boolean;
}

type RuleOptions = [HandlerMustHandleEventTypeOptions];
type MessageIds = "noEventBranching" | "missingDefaultCase";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    requireDefaultCase: { type: "boolean" }
  }
};

export const handlerMustHandleEventTypeRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Stripe webhook handlers must branch on `event.type` (switch, if-chain, or destructured `type` switch) so unrelated event kinds aren't silently treated alike.",
      recommended: true
    },
    schema: [optionSchema],
    messages: {
      noEventBranching:
        "Stripe event handler does not branch on `event.type` — add a `switch (event.type)` or `if (event.type === ...)` chain so each event kind is handled distinctly.",
      missingDefaultCase:
        "`switch (event.type)` is missing a `default` branch — Stripe adds new event types over time; add a default to log/ignore unknown kinds explicitly."
    }
  },
  defaultOptions: [{ requireDefaultCase: false }],
  create(context, [options]) {
    const requireDefaultCase = options.requireDefaultCase === true;
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
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(
        node: FunctionLike
      ) {
        const eventBinding = getEventBinding(node, imports);

        if (!eventBinding) {
          return;
        }

        const branching = analyzeBranching(node.body, eventBinding);

        if (!branching.found) {
          context.report({ node: eventBinding.paramNode, messageId: "noEventBranching" });
          return;
        }

        if (
          requireDefaultCase &&
          branching.switches.length > 0 &&
          branching.switches.every((s) => !s.cases.some((c) => c.test === null))
        ) {
          for (const sw of branching.switches) {
            context.report({ node: sw, messageId: "missingDefaultCase" });
          }
        }
      }
    };
  }
});

interface EventBinding {
  readonly name: string;
  readonly paramNode: TSESTree.Node;
}

function getEventBinding(
  node: FunctionLike,
  imports: StripeImports
): EventBinding | null {
  const fileIsStripe = imports.hasStripeImport;
  const eventAliases = imports.eventTypeAliases;

  for (const param of node.params) {
    const target =
      param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;

    if (target.type !== AST_NODE_TYPES.Identifier) {
      continue;
    }

    if (
      target.typeAnnotation &&
      typeReferencesStripeEvent(target.typeAnnotation, eventAliases)
    ) {
      return { name: target.name, paramNode: target };
    }

    if (fileIsStripe && target.name === "event") {
      return { name: target.name, paramNode: target };
    }
  }

  return null;
}

function typeReferencesStripeEvent(
  annotation: TSESTree.TSTypeAnnotation,
  eventAliases: ReadonlySet<string>
): boolean {
  return walkSome(annotation, (n) => {
    if (n.type !== AST_NODE_TYPES.TSTypeReference) {
      return false;
    }

    if (
      n.typeName.type === AST_NODE_TYPES.TSQualifiedName &&
      n.typeName.left.type === AST_NODE_TYPES.Identifier &&
      n.typeName.left.name === "Stripe" &&
      n.typeName.right.type === AST_NODE_TYPES.Identifier &&
      n.typeName.right.name === "Event"
    ) {
      return true;
    }

    if (
      n.typeName.type === AST_NODE_TYPES.Identifier &&
      eventAliases.has(n.typeName.name)
    ) {
      return true;
    }

    return false;
  });
}

interface BranchAnalysis {
  readonly found: boolean;
  readonly switches: TSESTree.SwitchStatement[];
}

function analyzeBranching(
  body: TSESTree.Node,
  binding: EventBinding
): BranchAnalysis {
  const switches: TSESTree.SwitchStatement[] = [];
  let found = false;

  const destructuredTypeNames = collectDestructuredTypeBindings(body, binding.name);

  walkSome(body, (n) => {
    if (n.type === AST_NODE_TYPES.SwitchStatement) {
      if (
        isEventTypeMember(n.discriminant, binding.name) ||
        (n.discriminant.type === AST_NODE_TYPES.Identifier &&
          destructuredTypeNames.has(n.discriminant.name))
      ) {
        switches.push(n);
        found = true;
      }
    }

    if (
      n.type === AST_NODE_TYPES.BinaryExpression &&
      (n.operator === "===" || n.operator === "==")
    ) {
      if (
        isEventTypeMember(n.left, binding.name) ||
        (n.left.type === AST_NODE_TYPES.Identifier &&
          destructuredTypeNames.has(n.left.name))
      ) {
        found = true;
      }
    }

    return false;
  });

  return { found, switches };
}

function isEventTypeMember(node: TSESTree.Node, eventName: string): boolean {
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === eventName &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === "type"
  );
}

function collectDestructuredTypeBindings(
  body: TSESTree.Node,
  eventName: string
): Set<string> {
  const out = new Set<string>();

  walkSome(body, (n) => {
    if (
      n.type === AST_NODE_TYPES.VariableDeclarator &&
      n.id.type === AST_NODE_TYPES.ObjectPattern &&
      n.init &&
      n.init.type === AST_NODE_TYPES.Identifier &&
      n.init.name === eventName
    ) {
      for (const prop of n.id.properties) {
        if (
          prop.type === AST_NODE_TYPES.Property &&
          prop.key.type === AST_NODE_TYPES.Identifier &&
          prop.key.name === "type"
        ) {
          if (prop.value.type === AST_NODE_TYPES.Identifier) {
            out.add(prop.value.name);
          }
        }
      }
    }

    return false;
  });

  return out;
}
