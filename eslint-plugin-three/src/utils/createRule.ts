import { ESLintUtils } from "@typescript-eslint/utils";

export interface ThreeRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<ThreeRuleDocs>(
  (ruleName) =>
    `https://github.com/boringstack-xyz/eslint-plugins/blob/main/eslint-plugin-three/docs/rules/${ruleName}.md`
);
