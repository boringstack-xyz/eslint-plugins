import { readFileSync, existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

type MessageIds = "missingKey" | "missingPluralKey" | "dictionaryReadFailed";

export interface StaticTranslationKeyExistsOptions {
  readonly dictionary: string;
}

type RuleOptions = [StaticTranslationKeyExistsOptions];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  required: ["dictionary"],
  properties: {
    dictionary: { type: "string", minLength: 1 }
  }
};

function collectLeafKeys(
  value: unknown,
  prefix: string,
  out: Set<string>
): void {
  if (typeof value === "string") {
    if (prefix !== "") {
      out.add(prefix);
    }

    return;
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  for (const [k, v] of Object.entries(value)) {
    const next = prefix === "" ? k : `${prefix}.${k}`;
    collectLeafKeys(v, next, out);
  }
}

function loadDictionary(pathFromRoot: string, cwd: string): Set<string> {
  const abs = isAbsolute(pathFromRoot)
    ? pathFromRoot
    : resolve(cwd, pathFromRoot);

  if (!existsSync(abs)) {
    throw new Error(`eslint-plugin-i18n-keys: dictionary not found: ${abs}`);
  }

  const raw = readFileSync(abs, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const keys = new Set<string>();

  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const [k, v] of Object.entries(parsed)) {
      collectLeafKeys(v, k, keys);
    }
  }

  return keys;
}

function getStringLiteral(
  node: TSESTree.CallExpressionArgument | undefined
): string | null {
  if (node === undefined) {
    return null;
  }

  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }

  return null;
}

interface CallModifiers {
  readonly counted: boolean;
  readonly ordinal: boolean;
  readonly context: string | null;
}

function propertyNamed(
  options: TSESTree.ObjectExpression,
  name: string
): TSESTree.Property | undefined {
  for (const property of options.properties) {
    if (property.type !== AST_NODE_TYPES.Property || property.computed) {
      continue;
    }

    if (
      property.key.type === AST_NODE_TYPES.Identifier &&
      property.key.name === name
    ) {
      return property;
    }

    if (
      property.key.type === AST_NODE_TYPES.Literal &&
      property.key.value === name
    ) {
      return property;
    }
  }

  return undefined;
}

/**
 * i18next derives the stored key from the call options: `count` selects a
 * plural form (`key_other` is the mandatory fallback, `key_ordinal_other`
 * with `ordinal: true`) and a string `context` appends `_<context>`.
 */
function getCallModifiers(
  node: TSESTree.CallExpressionArgument | undefined
): CallModifiers {
  if (node === undefined || node.type !== AST_NODE_TYPES.ObjectExpression) {
    return { counted: false, ordinal: false, context: null };
  }

  const ordinal = propertyNamed(node, "ordinal");
  const context = propertyNamed(node, "context");

  return {
    counted: propertyNamed(node, "count") !== undefined,
    ordinal:
      ordinal?.value.type === AST_NODE_TYPES.Literal &&
      ordinal.value.value === true,
    context:
      context?.value.type === AST_NODE_TYPES.Literal &&
      typeof context.value.value === "string" &&
      context.value.value !== ""
        ? context.value.value
        : null
  };
}

/** Keys i18next tries, most specific first, before falling back to `key` itself. */
function resolutionCandidates(
  key: string,
  modifiers: CallModifiers
): string[] {
  const bases =
    modifiers.context === null ? [key] : [`${key}_${modifiers.context}`, key];

  if (!modifiers.counted) {
    return bases;
  }

  const suffix = modifiers.ordinal ? "_ordinal_other" : "_other";

  return [...bases.map((base) => `${base}${suffix}`), ...bases];
}

function isTranslationCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;

  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === "t") {
    return true;
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === "t" &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === "i18n"
  ) {
    return true;
  }

  return false;
}

export const staticTranslationKeyExistsRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: "static-translation-key-exists",
  meta: {
    type: "problem",
    docs: {
      description:
        "Static string passed to `t(\"...\")` or `i18n.t(\"...\")` must exist as a leaf path in the canonical locale JSON, honouring i18next `count` and `context` suffixes."
    },
    schema: [optionSchema],
    messages: {
      missingKey:
        "Translation key \"{{key}}\" is not defined in {{dictionary}} (static keys only; dynamic templates are not checked).",
      missingPluralKey:
        "Counted translation key \"{{key}}\" has no \"{{fallback}}\" plural fallback in {{dictionary}} (i18next resolves `count` through `_one`/`_other` suffixes; `_other` is required).",
      dictionaryReadFailed:
        "Could not read i18n dictionary at {{path}} (cwd: {{cwd}})."
    }
  },
  defaultOptions: [{ dictionary: "src/lib/i18n/locales/en/common.json" }],
  create(context, [options]) {
    const cwd = context.cwd ?? process.cwd();
    let keys: Set<string> | undefined;

    try {
      keys = loadDictionary(options.dictionary, cwd);
    } catch {
      keys = undefined;
    }

    return {
      Program(node: TSESTree.Program): void {
        if (keys === undefined) {
          context.report({
            node,
            messageId: "dictionaryReadFailed",
            data: { path: options.dictionary, cwd }
          });
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        if (keys === undefined) {
          return;
        }

        if (!isTranslationCall(node)) {
          return;
        }

        const key = getStringLiteral(node.arguments[0]);

        if (key === null || key === "") {
          return;
        }

        const modifiers = getCallModifiers(node.arguments[1]);
        const candidates = resolutionCandidates(key, modifiers);

        if (candidates.some((candidate) => keys.has(candidate))) {
          return;
        }

        if (modifiers.counted) {
          context.report({
            node: node.arguments[0] ?? node,
            messageId: "missingPluralKey",
            data: {
              key,
              fallback: candidates[0] ?? key,
              dictionary: options.dictionary
            }
          });

          return;
        }

        context.report({
          node: node.arguments[0] ?? node,
          messageId: "missingKey",
          data: { key, dictionary: options.dictionary }
        });
      }
    };
  }
});
