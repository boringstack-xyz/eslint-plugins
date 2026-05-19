import micromatch from "micromatch";
import path from "node:path";

export const toPosixPath = (value: string): string => value.replaceAll("\\", "/");

export const getCwdPosix = (): string => toPosixPath(process.cwd());

export const posixRelativeFromCwd = (filename: string): string => {
  const posixFilename = toPosixPath(filename);

  // In ESLint tests (RuleTester), filenames are often already project-relative.
  // Treat relative filenames as-is so rule logic remains stable in both real
  // ESLint runs (absolute paths) and tests (relative paths).
  if (!path.isAbsolute(posixFilename)) {
    return posixFilename;
  }

  return path.posix.relative(getCwdPosix(), posixFilename);
};

export const isMatch = (value: string, pattern: string): boolean =>
  micromatch.isMatch(value, pattern, { dot: true });

export const isAnyMatch = (value: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => isMatch(value, pattern));

export const hasGlobChars = (value: string): boolean => /[*?[\]{}()!+@]/.test(value);

export const trimTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

