import {
  RULE_NAME,
  classnamesImportNameRule
} from "../../src/rules/classnamesImportName";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, classnamesImportNameRule, {
  valid: [
    {
      code: `
        import classNames from 'classnames';
        export function Button() {
          return <button className={classNames('btn')} />;
        }
      `
    },
    {
      code: `
        import * as classNames from 'classnames';
        export function Button() {
          return <button className={classNames.join('btn')} />;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import clsNames from 'classnames';
        export function Button() {
          return <button className={clsNames('btn')} />;
        }
      `,
      errors: [{ messageId: "wrongImportName" }]
    },
    {
      code: `
        import cn from 'classnames';
        export function Button() {
          return <button className={cn('btn')} />;
        }
      `,
      errors: [{ messageId: "wrongImportName" }]
    }
  ]
});
