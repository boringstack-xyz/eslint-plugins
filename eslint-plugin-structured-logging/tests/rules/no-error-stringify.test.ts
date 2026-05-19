import {
  RULE_NAME,
  noErrorStringifyRule
} from "../../src/rules/no-error-stringify";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noErrorStringifyRule, {
  valid: [
    {
      code: `import { getErrorMessage } from "./errors"; const m = getErrorMessage(error);`
    },
    {
      code: `const m = String(123);`
    },
    {
      code: `const m = obj.toString();`
    },
    {
      code: `const m = \`value: \${count}\`;`
    },
    {
      code: `const m = "" + value;`
    },
    {
      code: `import { getErrorMessage } from "./errors"; const m = \`oops: \${getErrorMessage(error)}\`;`
    }
  ],
  invalid: [
    {
      code: `const m = String(error);`,
      errors: [{ messageId: "noErrorStringify" }]
    },
    {
      code: `import { getErrorMessage } from "./errors"; const m = String(error);`,
      errors: [{ messageId: "noErrorStringify" }],
      output: `import { getErrorMessage } from "./errors"; const m = getErrorMessage(error);`
    },
    {
      code: `const m = err.toString();`,
      errors: [{ messageId: "noErrorStringify" }]
    },
    {
      code: `const m = \`oops: \${error}\`;`,
      errors: [{ messageId: "noErrorStringify" }]
    },
    {
      code: `const m = error + "";`,
      errors: [{ messageId: "noErrorStringify" }]
    },
    {
      code: `const m = "" + cause;`,
      errors: [{ messageId: "noErrorStringify" }]
    }
  ]
});
