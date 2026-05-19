import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import {
  type SemanticClassification,
  type SemanticCategory
} from "./categories";
import { getConstantReason } from "./constants";
import { isHookName } from "./hooks";
import {
  isReactComponentFunction,
  isReactComponentVariable
} from "./react";
import { type SchemaImportContext, isSchemaExpression } from "./schema";
import {
  getDeclarationName,
  getVariableDeclaratorName,
  isAmbientDeclaration,
  unwrapExpression
} from "../utils/ast";
import type { NormalizedOptions } from "../utils/config";

export interface ClassificationContext {
  readonly options: NormalizedOptions;
  readonly schemaImports: SchemaImportContext;
  readonly isDefaultExport?: boolean;
}

export function classifyTopLevelStatement(
  statement: TSESTree.Program["body"][number],
  context: ClassificationContext
): SemanticClassification[] {
  switch (statement.type) {
    case AST_NODE_TYPES.ImportDeclaration:
    case AST_NODE_TYPES.EmptyStatement:
    case AST_NODE_TYPES.ExportAllDeclaration:
      return [];

    case AST_NODE_TYPES.ExportNamedDeclaration:
      return classifyNamedExport(statement, context);

    case AST_NODE_TYPES.ExportDefaultDeclaration:
      return classifyDefaultExport(statement, context);

    default:
      return classifyDeclarationLike(statement, context);
  }
}

function classifyNamedExport(
  statement: TSESTree.ExportNamedDeclaration,
  context: ClassificationContext
): SemanticClassification[] {
  if (!statement.declaration) {
    return [];
  }

  return classifyDeclarationLike(statement.declaration, context);
}

function classifyDefaultExport(
  statement: TSESTree.ExportDefaultDeclaration,
  context: ClassificationContext
): SemanticClassification[] {
  const declaration = statement.declaration;
  const defaultContext = {
    ...context,
    isDefaultExport: true
  };

  return classifyDeclarationLike(declaration, defaultContext);
}

function classifyDeclarationLike(
  node: TSESTree.Node,
  context: ClassificationContext
): SemanticClassification[] {
  if (
    context.options.ignoreAmbientDeclarations &&
    isAmbientDeclaration(node)
  ) {
    return [];
  }

  if (isAmbientDeclaration(node)) {
    return [
      classification("type", node, getDeclarationName(node), "ambient declaration")
    ];
  }

  switch (node.type) {
    case AST_NODE_TYPES.TSInterfaceDeclaration:
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSModuleDeclaration:
      return [
        classification(
          "type",
          node,
          getDeclarationName(node),
          "TypeScript type-space declaration"
        )
      ];

    case AST_NODE_TYPES.TSEnumDeclaration:
      return [
        classification(
          context.options.enumCategory,
          node,
          getDeclarationName(node),
          context.options.enumCategory === "type"
            ? "enum configured as type"
            : "enum declaration"
        )
      ];

    case AST_NODE_TYPES.ClassDeclaration:
      return [
        classification("class", node, getDeclarationName(node), "class declaration")
      ];

    case AST_NODE_TYPES.FunctionDeclaration:
      return [classifyFunctionDeclaration(node, context)];

    case AST_NODE_TYPES.VariableDeclaration:
      return classifyVariableDeclaration(node, context);

    case AST_NODE_TYPES.ArrowFunctionExpression:
    case AST_NODE_TYPES.FunctionExpression:
      return [classifyFunctionExpression(node, undefined, context)];

    case AST_NODE_TYPES.ClassExpression:
      return [
        classification("class", node, getDeclarationName(node), "class expression")
      ];

    case AST_NODE_TYPES.CallExpression:
    case AST_NODE_TYPES.ArrayExpression:
    case AST_NODE_TYPES.ObjectExpression:
    case AST_NODE_TYPES.Literal:
    case AST_NODE_TYPES.TemplateLiteral:
      return [classifyDefaultExpression(node, context)];

    case AST_NODE_TYPES.TSDeclareFunction:
      return [
        classification(
          node.declare === true ? "type" : "function",
          node,
          getDeclarationName(node),
          node.declare === true
            ? "ambient function declaration"
            : "function overload signature"
        )
      ];

    default:
      return [];
  }
}

function classifyFunctionDeclaration(
  node: TSESTree.FunctionDeclaration,
  context: ClassificationContext
): SemanticClassification {
  const name = getDeclarationName(node);

  if (isHookName(name, context.options)) {
    return classification("hook", node, name, "function name matches hook pattern");
  }

  if (
    isReactComponentFunction(
      node,
      name,
      context.options,
      context.isDefaultExport === true
    )
  ) {
    return classification(
      "react-component",
      node,
      name,
      "function component returns JSX or React element"
    );
  }

  return classification("function", node, name, "function declaration");
}

function classifyFunctionExpression(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  name: string | undefined,
  context: ClassificationContext
): SemanticClassification {
  if (isHookName(name, context.options)) {
    return classification("hook", node, name, "function name matches hook pattern");
  }

  if (
    isReactComponentFunction(
      node,
      name,
      context.options,
      context.isDefaultExport === true
    )
  ) {
    return classification(
      "react-component",
      node,
      name,
      "function expression returns JSX or React element"
    );
  }

  return classification("function", node, name, "function expression");
}

function classifyVariableDeclaration(
  node: TSESTree.VariableDeclaration,
  context: ClassificationContext
): SemanticClassification[] {
  return node.declarations.map((declarator) =>
    classifyVariableDeclarator(declarator, context)
  );
}

function classifyVariableDeclarator(
  declarator: TSESTree.VariableDeclarator,
  context: ClassificationContext
): SemanticClassification {
  const name = getVariableDeclaratorName(declarator);
  const init = declarator.init ? unwrapExpression(declarator.init) : null;

  if (init && isSchemaExpression(init, context.schemaImports)) {
    return classification("schema", declarator, name, "schema builder expression");
  }

  if (isReactComponentVariable(declarator, context.options)) {
    return classification(
      "react-component",
      declarator,
      name,
      "React component variable"
    );
  }

  if (isHookName(name, context.options)) {
    return classification("hook", declarator, name, "variable name matches hook pattern");
  }

  if (
    init?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    init?.type === AST_NODE_TYPES.FunctionExpression
  ) {
    return classifyFunctionExpression(init, name, context);
  }

  if (init?.type === AST_NODE_TYPES.ClassExpression) {
    return classification("class", declarator, name, "class expression");
  }

  return classification("constant", declarator, name, getConstantReason(init));
}

function classifyDefaultExpression(
  expression: TSESTree.Expression,
  context: ClassificationContext
): SemanticClassification {
  const unwrapped = unwrapExpression(expression);

  if (isSchemaExpression(unwrapped, context.schemaImports)) {
    return classification("schema", expression, undefined, "default schema expression");
  }

  if (
    unwrapped.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    unwrapped.type === AST_NODE_TYPES.FunctionExpression
  ) {
    return classifyFunctionExpression(unwrapped, undefined, context);
  }

  if (unwrapped.type === AST_NODE_TYPES.ClassExpression) {
    return classification("class", expression, undefined, "default class expression");
  }

  return classification(
    "constant",
    expression,
    undefined,
    getConstantReason(unwrapped)
  );
}

function classification(
  category: SemanticCategory,
  node: TSESTree.Node,
  declarationName: string | undefined,
  reason: string
): SemanticClassification {
  const result = {
    category,
    node,
    reason
  };

  if (declarationName) {
    return {
      ...result,
      declarationName
    };
  }

  return result;
}
