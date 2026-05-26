import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "package-json-exact-deps";

type RuleOptions = [];
type MessageIds = "notExactDep" | "notCaratPeerDep";

/**
 * This rule checks that dependencies and devDependencies use exact versions (no ^ or ~).
 * peerDependencies must use caret ranges (^).
 *
 * Note: This rule requires the file to be parsed as JSON.
 * Use it with jsonc-eslint-parser or similar.
 */
export const packageJsonExactDepsRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce exact dependency versions in package.json (no ^ or ~)",
      recommended: false
    },
    schema: [],
    messages: {
      notExactDep:
        "Dependency version must be exact (no ^ or ~): {{key}}: {{value}}",
      notCaratPeerDep:
        "Peer dependency must use caret range (^): {{key}}: {{value}}"
    }
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;

    if (!filename.endsWith("package.json")) {
      return {};
    }

    return {
      "Program:exit"(program) {
        try {
          const text = context.sourceCode.getText();
          const pkg = JSON.parse(text) as Record<string, unknown>;

          // Check dependencies
          const deps = pkg.dependencies as Record<string, string> | undefined;
          if (deps) {
            for (const [key, value] of Object.entries(deps)) {
              if (typeof value === "string" && /^[~^]/.test(value)) {
                context.report({
                  node: program,
                  messageId: "notExactDep",
                  data: { key, value }
                });
              }
            }
          }

          // Check devDependencies
          const devDeps =
            pkg.devDependencies as Record<string, string> | undefined;
          if (devDeps) {
            for (const [key, value] of Object.entries(devDeps)) {
              if (typeof value === "string" && /^[~^]/.test(value)) {
                context.report({
                  node: program,
                  messageId: "notExactDep",
                  data: { key, value }
                });
              }
            }
          }

          // Check peerDependencies
          const peerDeps =
            pkg.peerDependencies as Record<string, string> | undefined;
          if (peerDeps) {
            for (const [key, value] of Object.entries(peerDeps)) {
              if (typeof value === "string" && !/^\^/.test(value)) {
                context.report({
                  node: program,
                  messageId: "notCaratPeerDep",
                  data: { key, value }
                });
              }
            }
          }
        } catch {
          // If JSON parsing fails, skip
        }
      }
    };
  }
});
