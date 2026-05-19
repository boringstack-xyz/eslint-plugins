import {
  RULE_NAME,
  storiesRequireDefaultExportRule
} from "../../src/rules/storiesRequireDefaultExport";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, storiesRequireDefaultExportRule, {
  valid: [
    {
      code: `
        export const Default = () => <button>Click</button>;
        export const Disabled = () => <button disabled>Disabled</button>;
      `,
      filename: "Button.stories.tsx"
    },
    {
      code: `
        const Default = () => <button>Click</button>;
        export { Default };
      `,
      filename: "Button.stories.tsx"
    }
  ],
  invalid: [
    {
      code: `
        export const Primary = () => <button>Click</button>;
        export const Disabled = () => <button disabled>Disabled</button>;
      `,
      filename: "Button.stories.tsx",
      errors: [{ messageId: "missingDefaultExport" }]
    }
  ]
});
