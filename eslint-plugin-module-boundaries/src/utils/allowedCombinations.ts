import type { SemanticCategory } from "../classifiers/categories";

export function isCategorySetAllowed(
  categories: ReadonlySet<SemanticCategory>,
  allow: readonly (readonly SemanticCategory[])[]
): boolean {
  if (categories.size <= 1) {
    return true;
  }

  const detected = [...categories];

  return allow.some((allowedGroup) => {
    const allowedSet = new Set(allowedGroup);

    return detected.every((category) => allowedSet.has(category));
  });
}
