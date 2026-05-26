import { parse as parseYaml } from "yaml";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";

export const RULE_NAME = "github-actions-permissions";

type RuleOptions = [];
type MessageIds = "missingPermissions" | "unpinnedRef";

const SHA_REGEX = /^[0-9a-f]{40}$/;

/**
 * This rule checks GitHub Actions workflows for:
 * 1. A top-level 'permissions' block exists
 * 2. Third-party actions are pinned to a commit SHA
 *
 * It requires yaml parser to be available.
 */
export const githubActionsPermissionsRule = createRule<RuleOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce permissions block and pinned action refs in GitHub Actions workflows",
      recommended: false
    },
    schema: [],
    messages: {
      missingPermissions:
        "GitHub Actions workflow must have a top-level 'permissions' block",
      unpinnedRef:
        "Action '{{action}}' must be pinned to a commit SHA ({{ref}})"
    }
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;

    if (
      !filename.endsWith(".yml") &&
      !filename.endsWith(".yaml")
    ) {
      return {};
    }

    if (!filename.includes(".github/workflows/")) {
      return {};
    }

    return {
      "Program:exit"(program) {
        try {
          const text = context.sourceCode.getText();
          const workflow = parseYaml(text) as Record<string, unknown>;

          // Check for permissions block
          if (!workflow.permissions) {
            context.report({
              node: program,
              messageId: "missingPermissions"
            });
          }

          // Check job steps for unpinned actions
          const jobs = workflow.jobs as Record<string, any> | undefined;
          if (jobs) {
            for (const job of Object.values(jobs)) {
              if (typeof job !== "object" || !job) {
                continue;
              }
              const steps = (job as any).steps;
              if (Array.isArray(steps)) {
                for (const step of steps) {
                  const uses = step.uses as string | undefined;
                  if (uses && uses.includes("@")) {
                    const parts = uses.split("@");
                    const ref = parts[parts.length - 1];

                    // Skip first-party actions (contain path like actions/ or .)
                    const action = parts[0];
                    if (
                      action &&
                      (action.startsWith("./") ||
                        (action.includes("/") && !uses.includes("/")))
                    ) {
                      continue;
                    }

                    // Check if ref is a valid SHA
                    if (action && ref && !SHA_REGEX.test(ref)) {
                      context.report({
                        node: program,
                        messageId: "unpinnedRef",
                        data: { action: action.split("/")[0], ref }
                      });
                    }
                  }
                }
              }
            }
          }
        } catch {
          // If YAML parsing fails, skip
        }
      }
    };
  }
});
