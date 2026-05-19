import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { analyzeSemanticModule } from "../analysis/semanticModule";
import { SEMANTIC_CATEGORIES } from "../classifiers/categories";
import { isCategorySetAllowed } from "../utils/allowedCombinations";
import { buildMixedCategoriesMessage } from "../utils/reporting";
import { createRule } from "../utils/createRule";
import type { SingleSemanticModuleOptions } from "../utils/config";

export const RULE_NAME = "single-semantic-module";

type Options = [SingleSemanticModuleOptions?];
type MessageIds = "mixedSemanticCategories";

const categoryEnum = [...SEMANTIC_CATEGORIES];

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    allow: {
      type: "array",
      items: {
        type: "array",
        minItems: 2,
        uniqueItems: true,
        items: {
          type: "string",
          enum: categoryEnum
        }
      }
    },
    enumCategory: {
      type: "string",
      enum: ["enum", "type"]
    },
    debug: {
      type: "boolean"
    },
    ignoreAmbientDeclarations: {
      type: "boolean"
    },
    schemaLibraries: {
      type: "array",
      uniqueItems: true,
      items: {
        type: "string",
        enum: ["zod", "yup", "valibot"]
      }
    },
    reactComponentDetection: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: {
          type: "boolean"
        }
      }
    },
    hookDetection: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: {
          type: "boolean"
        },
        namePattern: {
          type: "string"
        }
      }
    }
  }
};

export const singleSemanticModuleRule = createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Require each TypeScript module to contain only one top-level semantic concern."
    },
    schema: [optionSchema],
    messages: {
      mixedSemanticCategories: "{{message}}"
    }
  },
  defaultOptions: [{}],
  create(context, [options]) {
    return {
      Program(program) {
        const analysis = analyzeSemanticModule(program, options);

        if (isCategorySetAllowed(analysis.categories, analysis.options.allow)) {
          return;
        }

        const reportNode = analysis.classifications[1]?.node ?? program;

        context.report({
          node: reportNode,
          messageId: "mixedSemanticCategories",
          data: {
            message: buildMixedCategoriesMessage(
              analysis.classifications,
              analysis.options.debug
            )
          }
        });
      }
    };
  }
});
