import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { noNarrationCommentsRule } from "./rules/no-narration-comments";
import { noPrReferenceCommentsRule } from "./rules/no-pr-reference-comments";

type CommentHygienePlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: CommentHygienePlugin = {
  meta: {
    name: "eslint-plugin-comment-hygiene",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    "comment-hygiene": plugin
  },
  rules: recommendedRules
};

export { noNarrationCommentsRule, noPrReferenceCommentsRule };
export { rules };
export const configs = plugin.configs;
export default plugin;
