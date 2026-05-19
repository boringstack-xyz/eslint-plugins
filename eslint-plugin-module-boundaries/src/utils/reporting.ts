import {
  sortCategories,
  type SemanticCategory,
  type SemanticClassification
} from "../classifiers/categories";

export function buildMixedCategoriesMessage(
  classifications: readonly SemanticClassification[],
  debug: boolean
): string {
  const categories = sortCategories(
    classifications.map((classification) => classification.category)
  );

  const lines = [
    "Mixed semantic categories detected in module:",
    ...categories.map((category) => `- ${category}`)
  ];

  if (debug) {
    lines.push("", "Detected declarations:");

    for (const classification of classifications) {
      lines.push(
        `- ${formatClassificationCategory(classification.category)}: ${classification.declarationName ?? "<anonymous>"} (${classification.reason})`
      );
    }
  }

  lines.push(
    "",
    "A module must contain only one semantic concern.",
    "Move declarations into separate files/modules."
  );

  return lines.join("\n");
}

function formatClassificationCategory(category: SemanticCategory): string {
  return category;
}
