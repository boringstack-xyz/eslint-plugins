import {
  RULE_NAME,
  classnamesRequiredRule
} from "../../src/rules/classnamesRequired";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, classnamesRequiredRule, {
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
        function Button({ disabled }) {
          return <button className={getClasses(disabled)}>Click</button>;
        }
      `
    },
    {
      code: `
        import classNames from 'classnames';
        function Button({ disabled }) {
          return <button className={classNames('btn', { disabled })}>Click</button>;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        function Button({ isActive }) {
          return <button className={isActive ? 'active' : 'inactive'}>Click</button>;
        }
      `,
      errors: [{ messageId: "mustUseClassnames" }]
    },
    {
      code: `
        function Button() {
          return <button className={\`btn \${active ? 'active' : ''}\`}>Click</button>;
        }
      `,
      errors: [{ messageId: "mustUseClassnames" }]
    }
  ]
});
