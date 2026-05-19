import type { TSESTree } from "@typescript-eslint/utils";

export const SEMANTIC_CATEGORIES = [
  "type",
  "constant",
  "function",
  "class",
  "react-component",
  "hook",
  "schema",
  "enum"
] as const;

export type SemanticCategory = (typeof SEMANTIC_CATEGORIES)[number];

export type EnumCategory = Extract<SemanticCategory, "enum" | "type">;

export const CATEGORY_PRECEDENCE = [
  "schema",
  "react-component",
  "hook",
  "class",
  "function",
  "enum",
  "type",
  "constant"
] as const satisfies readonly SemanticCategory[];

export interface SemanticClassification {
  readonly category: SemanticCategory;
  readonly node: TSESTree.Node;
  readonly declarationName?: string;
  readonly reason: string;
}

export function sortCategories(
  categories: Iterable<SemanticCategory>
): SemanticCategory[] {
  const categorySet = new Set(categories);

  return SEMANTIC_CATEGORIES.filter((category) => categorySet.has(category));
}
