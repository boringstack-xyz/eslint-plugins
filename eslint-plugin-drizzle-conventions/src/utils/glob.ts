const compiledGlobs = new Map<string, RegExp>();

export function globToRegExp(pattern: string): RegExp {
  const cached = compiledGlobs.get(pattern);

  if (cached) {
    return cached;
  }

  const compiled = new RegExp(`^${compileGlobBody(pattern)}$`);

  compiledGlobs.set(pattern, compiled);

  return compiled;
}

export function matchesAnyGlob(
  filename: string,
  patterns: readonly string[]
): boolean {
  if (patterns.length === 0) {
    return false;
  }

  const normalized = filename.replace(/\\/g, "/");

  for (const pattern of patterns) {
    if (globToRegExp(pattern).test(normalized)) {
      return true;
    }
  }

  return false;
}

function compileGlobBody(pattern: string): string {
  let result = "";
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === "*") {
      const nextChar = pattern[i + 1];

      if (nextChar === "*") {
        const followingChar = pattern[i + 2];

        if (followingChar === "/") {
          result += "(?:.*/)?";
          i += 3;
          continue;
        }

        result += ".*";
        i += 2;
        continue;
      }

      result += "[^/]*";
      i += 1;
      continue;
    }

    if (char === "?") {
      result += "[^/]";
      i += 1;
      continue;
    }

    if (char === ".") {
      result += "\\.";
      i += 1;
      continue;
    }

    if (
      char === "+" ||
      char === "(" ||
      char === ")" ||
      char === "|" ||
      char === "^" ||
      char === "$" ||
      char === "{" ||
      char === "}" ||
      char === "[" ||
      char === "]" ||
      char === "\\"
    ) {
      result += `\\${char}`;
      i += 1;
      continue;
    }

    result += char;
    i += 1;
  }

  return result;
}
