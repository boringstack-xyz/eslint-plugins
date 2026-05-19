import {
  RULE_NAME,
  noDarkModeClassesRule
} from "../../src/rules/noDarkModeClasses";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDarkModeClassesRule, {
  valid: [
    {
      code: `
        function Button() {
          return <button className="bg-blue-500">Click</button>;
        }
      `
    },
    {
      code: `
        function Card() {
          return <div className="p-4 bg-white text-black">Content</div>;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        function Button() {
          return <button className="bg-blue-500 dark:bg-blue-900">Click</button>;
        }
      `,
      errors: [{ messageId: "noDarkMode" }]
    },
    {
      code: `
        function Card() {
          return <div className="dark:text-white p-4">Content</div>;
        }
      `,
      errors: [{ messageId: "noDarkMode" }]
    },
    {
      code: `
        function Div() {
          const cls = \`p-4 dark:bg-black\`;
          return <div className={cls}>Content</div>;
        }
      `,
      errors: [{ messageId: "noDarkMode" }]
    }
  ]
});
