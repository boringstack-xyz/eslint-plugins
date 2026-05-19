import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import type { NormalizedOptions } from "../utils/config";
import {
  containsJsx,
  containsNode,
  functionReturnsJsx,
  getVariableDeclaratorName
} from "../utils/ast";

export function isReactComponentName(name: string | undefined): boolean {
  return Boolean(name && /^[A-Z][A-Za-z0-9]*$/.test(name));
}

export function isReactComponentFunction(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression,
  name: string | undefined,
  options: NormalizedOptions,
  isDefaultExport = false
): boolean {
  if (!options.reactComponentDetection.enabled) {
    return false;
  }

  const hasComponentIdentity = isReactComponentName(name) || isDefaultExport;

  if (!hasComponentIdentity) {
    return false;
  }

  if (node.returnType && typeReferencesJsxValue(node.returnType.typeAnnotation)) {
    return true;
  }

  return functionReturnsJsx(node);
}

export function isReactComponentVariable(
  declarator: TSESTree.VariableDeclarator,
  options: NormalizedOptions
): boolean {
  if (!options.reactComponentDetection.enabled) {
    return false;
  }

  const name = getVariableDeclaratorName(declarator);

  if (!isReactComponentName(name)) {
    return false;
  }

  if (
    declarator.id.type === AST_NODE_TYPES.Identifier &&
    declarator.id.typeAnnotation &&
    typeReferencesReactComponent(declarator.id.typeAnnotation.typeAnnotation)
  ) {
    return true;
  }

  if (!declarator.init) {
    return false;
  }

  if (
    declarator.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    declarator.init.type === AST_NODE_TYPES.FunctionExpression
  ) {
    return isReactComponentFunction(declarator.init, name, options);
  }

  return containsJsx(declarator.init);
}

export function typeReferencesReactComponent(node: TSESTree.Node): boolean {
  return containsNode(node, (candidate) => {
    if (candidate.type !== AST_NODE_TYPES.TSTypeReference) {
      return false;
    }

    const name = entityNameToString(candidate.typeName);

    return (
      name === "FC" ||
      name === "FunctionComponent" ||
      name === "React.FC" ||
      name === "React.FunctionComponent"
    );
  });
}

export function typeReferencesJsxValue(node: TSESTree.Node): boolean {
  return containsNode(node, (candidate) => {
    if (candidate.type !== AST_NODE_TYPES.TSTypeReference) {
      return false;
    }

    const name = entityNameToString(candidate.typeName);

    return (
      name === "JSX.Element" ||
      name === "React.ReactElement" ||
      name === "React.ReactNode"
    );
  });
}

function entityNameToString(
  entityName: TSESTree.TSTypeReference["typeName"]
): string {
  if (entityName.type === AST_NODE_TYPES.Identifier) {
    return entityName.name;
  }

  if (entityName.type === AST_NODE_TYPES.TSQualifiedName) {
    return `${entityNameToString(entityName.left)}.${entityName.right.name}`;
  }

  // `this` can appear in some type positions (e.g. `this["prop"]` patterns).
  return "this";
}
