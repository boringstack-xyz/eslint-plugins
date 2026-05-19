import { ESLintUtils } from "@typescript-eslint/utils";

export interface ReactComponentArchitectureRuleDocs {
  readonly description: string;
  readonly recommended?: boolean;
}

export const createRule =
  ESLintUtils.RuleCreator<ReactComponentArchitectureRuleDocs>(
    (ruleName) =>
      `https://github.com/agjs/eslint-plugin-react-component-architecture/blob/main/docs/rules/${ruleName}.md`
  );
