import {
  RULE_NAME,
  noTemplateTrimEmptyTernaryRule
} from "../../src/rules/noTemplateTrimEmptyTernary";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noTemplateTrimEmptyTernaryRule, {
  valid: [
    {
      name: "plain string comparison is fine — no template literal",
      code: `const x = name === "" ? fallback : name;`
    },
    {
      name: "template literal without .trim() is fine",
      code: 'const x = `${first} ${last}` === "" ? fallback : `${first} ${last}`;'
    },
    {
      name: ".trim() on an identifier (not a template) is fine",
      code: `const x = name.trim() === "" ? fallback : name.trim();`
    },
    {
      name: "non-empty comparison against template + trim is fine",
      code: 'const x = `${first}`.trim() === "active" ? a : b;'
    },
    {
      name: "named util call is the encouraged form",
      code: `const x = buildDisplayName({ first, last, fallback: email });`
    }
  ],
  invalid: [
    {
      name: "template + trim() === '' is flagged",
      code: 'const x = `${first} ${last}`.trim() === "" ? email : `${first} ${last}`.trim();',
      errors: [{ messageId: "extractToUtil" }]
    },
    {
      name: "template + trim() !== '' is also flagged (same shape, inverse intent)",
      code: 'const x = `${first} ${last}`.trim() !== "" ? `${first} ${last}`.trim() : email;',
      errors: [{ messageId: "extractToUtil" }]
    },
    {
      name: "argument order swap is still flagged",
      code: 'const x = "" === `${first}`.trim() ? email : `${first}`.trim();',
      errors: [{ messageId: "extractToUtil" }]
    },
    {
      name: "nullish-coalesced operands inside template still trigger",
      code: 'const x = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() === "" ? email : `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();',
      errors: [{ messageId: "extractToUtil" }]
    }
  ]
});
