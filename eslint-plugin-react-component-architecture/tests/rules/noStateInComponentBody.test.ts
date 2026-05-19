import {
  RULE_NAME,
  noStateInComponentBodyRule
} from "../../src/rules/noStateInComponentBody";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noStateInComponentBodyRule, {
  valid: [
    {
      code: `
        function useCounter() {
          const [count, setCount] = useState(0);
          return { count, setCount };
        }
        function Counter() {
          const { count } = useCounter();
          return <div>{count}</div>;
        }
      `,
      filename: "Counter.tsx"
    },
    {
      code: `
        function Button() {
          const id = useId();
          return <button id={id}>Click</button>;
        }
      `,
      filename: "Button.tsx"
    },
    {
      code: `
        export const Default = () => {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        };
      `,
      filename: "Component.stories.tsx"
    }
  ],
  invalid: [
    {
      code: `
        function Counter() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `,
      filename: "Counter.tsx",
      errors: [{ messageId: "noStateInComponent" }]
    },
    {
      code: `
        const Counter = () => {
          const [items, setItems] = useReducer(reducer, []);
          return <ul>{items}</ul>;
        };
      `,
      filename: "Counter.tsx",
      errors: [{ messageId: "noStateInComponent" }]
    }
  ]
});
