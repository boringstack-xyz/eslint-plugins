import { maskPiiFieldsRule } from "./mask-pii-fields";
import { noErrorStringifyRule } from "./no-error-stringify";
import { requireEventFieldRule } from "./require-event-field";
import { typedEventNamesRule } from "./typed-event-names";

export const rules = {
  "require-event-field": requireEventFieldRule,
  "mask-pii-fields": maskPiiFieldsRule,
  "no-error-stringify": noErrorStringifyRule,
  "typed-event-names": typedEventNamesRule
};
