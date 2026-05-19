import {
  RULE_NAME,
  noInlineJsxFunctionsRule
} from "../../src/rules/noInlineJsxFunctions";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noInlineJsxFunctionsRule, {
  valid: [
    {
      code: `
        function Button() {
          const handleClick = () => alert('clicked');
          return <button onClick={handleClick}>Click</button>;
        }
      `
    },
    {
      code: `
        function Form() {
          const handleSubmit = (e) => { e.preventDefault(); };
          return <form onSubmit={handleSubmit}></form>;
        }
      `
    },
    {
      code: `
        function Input() {
          const onChange = (e) => setVal(e.target.value);
          return <input onChange={onChange} />;
        }
      `
    },
    {
      code: `
        // Story files are exempt
        export const Default = () => (
          <button onClick={() => alert('demo')}>Click</button>
        );
      `,
      filename: "Button.stories.tsx"
    }
  ],
  invalid: [
    {
      code: `
        function Button() {
          return <button onClick={() => alert('clicked')}>Click</button>;
        }
      `,
      errors: [{ messageId: "noInlineFunction" }]
    },
    {
      code: `
        function Form() {
          return <form onSubmit={(e) => { e.preventDefault(); }}></form>;
        }
      `,
      errors: [{ messageId: "noInlineFunction" }]
    },
    {
      code: `
        const Input = () => (
          <input onChange={function(e) { setVal(e.target.value); }} />
        );
      `,
      errors: [{ messageId: "noInlineFunction" }]
    }
  ]
});
