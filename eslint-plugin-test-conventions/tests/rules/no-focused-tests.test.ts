import {
  RULE_NAME,
  noFocusedTestsRule
} from "../../src/rules/no-focused-tests";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noFocusedTestsRule, {
  valid: [
    { code: `test("ok", () => {});` },
    { code: `it("ok", () => {});` },
    { code: `describe("group", () => { it("ok", () => {}); });` },
    { code: `myObj.only("not a test", () => {});` },
    { code: `test.skip("flaky", () => {});` },
    { code: `test.each([1, 2])("case %s", () => {});` },
    { code: `someLib.fdescribe();` },
    {
      code: `fonly("ok", () => {});`,
      options: [{ focusedAliases: [] }]
    }
  ],
  invalid: [
    {
      code: `test.only("focused", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    },
    {
      code: `it.only("focused", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    },
    {
      code: `describe.only("group", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    },
    {
      code: `test["only"]("focused", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    },
    {
      code: `describe.skip.only("nested", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    },
    {
      code: `fdescribe("group", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    },
    {
      code: `fit("focused", () => {});`,
      errors: [{ messageId: "focusedTest" }]
    }
  ]
});
