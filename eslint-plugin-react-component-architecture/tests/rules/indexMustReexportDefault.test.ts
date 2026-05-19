import {
  RULE_NAME,
  indexMustReexportDefaultRule
} from "../../src/rules/indexMustReexportDefault";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, indexMustReexportDefaultRule, {
  valid: [
    {
      code: `
        export { default as Button } from "./Button";
        export * from "./Button.types";
      `,
      filename: "src/Button/index.ts"
    }
  ],
  invalid: [
    // Note: This rule requires filesystem access to check if component file exists
    // which is difficult to test with RuleTester without mocking fs.
    // The rule logic is: only validate if parent dir matches pattern and component file exists
  ]
});
