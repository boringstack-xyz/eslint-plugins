import {
  RULE_NAME,
  noUntranslatedJsxTextRule
} from "../../src/rules/noUntranslatedJsxText";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noUntranslatedJsxTextRule, {
  valid: [
    {
      code: `
        function Button() {
          return <button>{t("auth.login.submit")}</button>;
        }
      `
    },
    {
      code: `
        function Code() {
          return <code>npm install</code>;
        }
      `
    },
    {
      code: `
        function Symbol() {
          return <div>ABC_123</div>;
        }
      `
    },
    {
      code: `
        function Pre() {
          return <pre>const x = 1;</pre>;
        }
      `
    },
    {
      code: `
        function Empty() {
          return <div></div>;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        function Button() {
          return <button>Submit</button>;
        }
      `,
      errors: [{ messageId: "untranslatedText" }]
    },
    {
      code: `
        function Card() {
          return <h1>Welcome</h1>;
        }
      `,
      errors: [{ messageId: "untranslatedText" }]
    },
    {
      code: `
        function Form() {
          return (
            <>
              <label>Email</label>
            </>
          );
        }
      `,
      errors: [{ messageId: "untranslatedText" }]
    }
  ]
});
