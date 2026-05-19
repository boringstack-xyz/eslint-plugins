import {
  RULE_NAME,
  noJsxComputationRule
} from "../../src/rules/noJsxComputation";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noJsxComputationRule, {
  valid: [
    {
      code: `
        function List() {
          const items = getItems();
          return <ul>{items}</ul>;
        }
      `
    },
    {
      code: `
        function Conditional() {
          return <div>{isActive ? 'on' : 'off'}</div>;
        }
      `
    },
    {
      code: `
        // Stories are exempt
        export const Default = () => (
          <div>{items.map((i) => <span key={i}>{i}</span>)}</div>
        );
      `,
      filename: "Component.stories.tsx"
    }
  ],
  invalid: [
    {
      code: `
        function List() {
          return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
        }
      `,
      errors: [{ messageId: "noComputation" }]
    },
    {
      code: `
        function Filtered() {
          return <ul>{items.filter(x => x.active).map(x => <li>{x}</li>)}</ul>;
        }
      `,
      errors: [{ messageId: "noComputation" }]
    },
    {
      code: `
        function Sum() {
          return <span>{a + b + c}</span>;
        }
      `,
      errors: [{ messageId: "noComputation" }]
    }
  ]
});
