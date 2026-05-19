import path from "node:path";

import micromatch from "micromatch";

/**
 * Returns the file's repo-relative path with forward slashes — micromatch
 * patterns assume `/` regardless of platform.
 */
export function toPosixRelative(filename: string, cwd: string): string {
  const rel = path.relative(cwd, filename);
  return rel.split(path.sep).join("/");
}

export function matchesAnyGlob(
  relativePath: string,
  patterns: readonly string[]
): boolean {
  if (patterns.length === 0) {
    return false;
  }
  return micromatch.isMatch(relativePath, [...patterns], { dot: true });
}

/**
 * Returns true when `importSource` matches any of the configured patterns.
 * Patterns may be globs (`**\/db/**`) or bare module specifiers
 * (`drizzle-orm`). Bare specifiers match exact-equal or prefix-with-`/`.
 */
export function importMatchesAny(
  importSource: string,
  patterns: readonly string[]
): boolean {
  for (const pat of patterns) {
    if (pat.includes("*") || pat.includes("?")) {
      if (
        micromatch.isMatch(importSource, pat, {
          dot: true,
          contains: true
        })
      ) {
        return true;
      }
      continue;
    }
    if (importSource === pat || importSource.startsWith(`${pat}/`)) {
      return true;
    }
  }
  return false;
}
