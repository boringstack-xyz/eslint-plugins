import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { staticTranslationKeyExistsRule } from "../../src/rules/static-translation-key-exists";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const dictPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/test-dict.json"
);

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { ecmaVersion: 2022, sourceType: "module" }
  }
});

ruleTester.run("static-translation-key-exists", staticTranslationKeyExistsRule, {
  valid: [
    {
      code: `const x = t("a.b");`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `i18n.t("leaf");`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("files", { count: 2 });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `i18n.t("files", { "count": items.length });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("nested.items", { count });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("rank", { count: 3, ordinal: true });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("friend", { context: "male" });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("guests", { count: 4, context: "vip" });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("leaf", { count: 4 });`,
      options: [{ dictionary: dictPath }]
    },
    {
      code: `t("leaf", { context: "unknown" });`,
      options: [{ dictionary: dictPath }]
    }
  ],
  invalid: [
    {
      code: `t("nope");`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingKey" }]
    },
    {
      code: `t("files");`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingKey" }]
    },
    {
      code: `t("nope", { count: 2 });`,
      options: [{ dictionary: dictPath }],
      errors: [
        {
          messageId: "missingPluralKey",
          data: { key: "nope", fallback: "nope_other", dictionary: dictPath }
        }
      ]
    },
    {
      code: `t("rank", { count: 2 });`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingPluralKey" }]
    },
    {
      code: `t("files", { count: 2, ordinal: true });`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingPluralKey" }]
    },
    {
      code: `t("friend", { context: "other" });`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingKey" }]
    },
    {
      code: `t("friend", { context: gender });`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingKey" }]
    }
  ]
});
