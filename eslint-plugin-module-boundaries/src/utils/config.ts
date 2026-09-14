import type { EnumCategory, SemanticCategory } from "../classifiers/categories";

export type SchemaLibrary = "zod" | "yup" | "valibot";

export interface SingleSemanticModuleOptions {
  readonly allow?: readonly (readonly SemanticCategory[])[];
  readonly enumCategory?: EnumCategory;
  readonly debug?: boolean;
  readonly ignoreAmbientDeclarations?: boolean;
  /**
   * Only exported declarations define a module's semantics. When true,
   * non-exported top-level declarations (a config object, a render
   * helper, a private class) are not classified, so a hook module may keep
   * the helpers only it uses (default false).
   */
  readonly ignorePrivateDeclarations?: boolean;
  readonly schemaLibraries?: readonly SchemaLibrary[];
  readonly reactComponentDetection?: {
    readonly enabled?: boolean;
  };
  readonly hookDetection?: {
    readonly enabled?: boolean;
    readonly namePattern?: string;
  };
}

export interface NormalizedOptions {
  readonly allow: readonly (readonly SemanticCategory[])[];
  readonly enumCategory: EnumCategory;
  readonly debug: boolean;
  readonly ignoreAmbientDeclarations: boolean;
  readonly ignorePrivateDeclarations: boolean;
  readonly schemaLibraries: readonly SchemaLibrary[];
  readonly reactComponentDetection: {
    readonly enabled: boolean;
  };
  readonly hookDetection: {
    readonly enabled: boolean;
    readonly namePattern: RegExp;
    readonly namePatternSource: string;
  };
}

export const DEFAULT_HOOK_NAME_PATTERN = "^use[A-Z0-9].*";

export function normalizeOptions(
  options: SingleSemanticModuleOptions = {}
): NormalizedOptions {
  const hookPattern =
    options.hookDetection?.namePattern ?? DEFAULT_HOOK_NAME_PATTERN;

  return {
    allow: options.allow ?? [],
    enumCategory: options.enumCategory ?? "enum",
    debug: options.debug ?? false,
    ignoreAmbientDeclarations: options.ignoreAmbientDeclarations ?? false,
    ignorePrivateDeclarations: options.ignorePrivateDeclarations ?? false,
    schemaLibraries: options.schemaLibraries ?? ["zod", "yup", "valibot"],
    reactComponentDetection: {
      enabled: options.reactComponentDetection?.enabled ?? true
    },
    hookDetection: {
      enabled: options.hookDetection?.enabled ?? true,
      namePattern: compilePattern(hookPattern),
      namePatternSource: hookPattern
    }
  };
}

function compilePattern(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch {
    return new RegExp(DEFAULT_HOOK_NAME_PATTERN);
  }
}
