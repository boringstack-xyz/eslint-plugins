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
    }
  ],
  invalid: [
    {
      code: `t("nope");`,
      options: [{ dictionary: dictPath }],
      errors: [{ messageId: "missingKey" }]
    }
  ]
});
