import type { TSESTree } from "@typescript-eslint/utils";

import {
  type SemanticCategory,
  type SemanticClassification
} from "../classifiers/categories";
import { classifyTopLevelStatement } from "../classifiers/classifyNode";
import { collectSchemaImportContext } from "../classifiers/schema";
import {
  normalizeOptions,
  type NormalizedOptions,
  type SingleSemanticModuleOptions
} from "../utils/config";

export interface SemanticModuleAnalysis {
  readonly categories: ReadonlySet<SemanticCategory>;
  readonly classifications: readonly SemanticClassification[];
  readonly options: NormalizedOptions;
}

export function analyzeSemanticModule(
  program: TSESTree.Program,
  rawOptions: SingleSemanticModuleOptions = {}
): SemanticModuleAnalysis {
  const options = normalizeOptions(rawOptions);
  const schemaImports = collectSchemaImportContext(program, options);
  const classifications = program.body.flatMap((statement) =>
    classifyTopLevelStatement(statement, {
      options,
      schemaImports
    })
  );

  return {
    categories: new Set(
      classifications.map((classification) => classification.category)
    ),
    classifications,
    options
  };
}
