import { noTemplateTrimEmptyTernaryRule } from "./noTemplateTrimEmptyTernary";
import { preferEarlyReturnRule } from "./preferEarlyReturn";

export const rules = {
  "prefer-early-return": preferEarlyReturnRule,
  "no-template-trim-empty-ternary": noTemplateTrimEmptyTernaryRule
};
