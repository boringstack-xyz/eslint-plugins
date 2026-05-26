import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "no-untranslated-jsx-text";

export interface NoUntranslatedJsxTextOptions {
  readonly ignoreElements?: readonly string[];
  readonly allowedPatterns?: readonly string[];
  readonly ignoreFiles?: readonly string[];
}

type RuleOptions = [NoUntranslatedJsxTextOptions];
type MessageIds = "untranslatedText";

const DEFAULT_IGNORE_ELEMENTS = [
  "Code",
  "pre",
  "code",
  "kbd",
  "samp",
  "var"
];
const DEFAULT_ALLOWED_PATTERNS = ["^[A-Z0-9_-]+$"];
const DEFAULT_IGNORE_FILES = [
  "**/*.stories.tsx",
  "**/*.test.tsx",
  "**/*.spec.tsx"
];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    ignoreElements: {
      type: "array",
      items: { type: "string" }
    },
    allowedPatterns: {
      type: "array",
      items: { type: "string" }
    },
    ignoreFiles: {
      type: "array",
      items: { type: "string" }
    }
  }
};

function isUserFacingText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.length <= 1) return false;
  // Must contain at least one letter
  return /[a-zA-Z]/.test(trimmed);
}

function shouldIgnoreFile(
  filename: string,
  patterns: readonly string[]
): boolean {
  return patterns.some((pattern) => {
    // Simple glob matching for common patterns
    const globRegex = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(globRegex).test(filename);
  });
}

export const noUntranslatedJsxTextRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Flag user-visible string literals in JSX that should be wrapped in t(...)"
    },
    schema: [optionSchema],
    messages: {
      untranslatedText:
        'Hardcoded user-facing text "{{text}}" — wrap in t("...") or move to a translation key.'
    }
  },
  defaultOptions: [
    {
      ignoreElements: DEFAULT_IGNORE_ELEMENTS,
      allowedPatterns: DEFAULT_ALLOWED_PATTERNS,
      ignoreFiles: DEFAULT_IGNORE_FILES
    }
  ],
  create(context, [options]) {
    const ignoreElements = new Set(
      options.ignoreElements ?? DEFAULT_IGNORE_ELEMENTS
    );
    const allowedPatterns = (
      options.allowedPatterns ?? DEFAULT_ALLOWED_PATTERNS
    ).map((p) => new RegExp(p));
    const ignoreFiles = options.ignoreFiles ?? DEFAULT_IGNORE_FILES;

    // Check if this file should be ignored
    const filename = context.filename;
    if (shouldIgnoreFile(filename, ignoreFiles)) {
      return {};
    }

    return {
      JSXElement(node: TSESTree.JSXElement) {
        const openingElement = node.openingElement;
        const elementName =
          openingElement.name.type === AST_NODE_TYPES.JSXIdentifier
            ? openingElement.name.name
            : null;

        if (elementName && ignoreElements.has(elementName)) {
          return;
        }

        for (const child of node.children) {
          if (child.type === AST_NODE_TYPES.JSXText) {
            const text = child.value;
            if (!isUserFacingText(text)) continue;

            // Check if text matches any allowed pattern
            const isAllowed = allowedPatterns.some((regex) =>
              regex.test(text.trim())
            );
            if (isAllowed) continue;

            context.report({
              node: child,
              messageId: "untranslatedText",
              data: {
                text: text.trim().substring(0, 50)
              }
            });
          }
        }
      },
      JSXFragment(node: TSESTree.JSXFragment) {
        for (const child of node.children) {
          if (child.type === AST_NODE_TYPES.JSXText) {
            const text = child.value;
            if (!isUserFacingText(text)) continue;

            // Check if text matches any allowed pattern
            const isAllowed = allowedPatterns.some((regex) =>
              regex.test(text.trim())
            );
            if (isAllowed) continue;

            context.report({
              node: child,
              messageId: "untranslatedText",
              data: {
                text: text.trim().substring(0, 50)
              }
            });
          }
        }
      }
    };
  }
});
