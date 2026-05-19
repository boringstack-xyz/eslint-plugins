import {
  RULE_NAME,
  forwardrefDisplayNameRule
} from "../../src/rules/forwardrefDisplayName";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, forwardrefDisplayNameRule, {
  valid: [
    {
      code: `
        import { forwardRef } from 'react';
        const Button = forwardRef((props, ref) => (
          <button ref={ref} {...props} />
        ));
        Button.displayName = 'Button';
      `
    },
    {
      code: `
        import React from 'react';
        const Input = React.forwardRef((props, ref) => (
          <input ref={ref} {...props} />
        ));
        Input.displayName = 'CustomInput';
      `
    }
  ],
  invalid: [
    {
      code: `
        import { forwardRef } from 'react';
        const Button = forwardRef((props, ref) => (
          <button ref={ref} {...props} />
        ));
      `,
      errors: [{ messageId: "missingDisplayName" }]
    },
    {
      code: `
        import React from 'react';
        const Input = React.forwardRef((props, ref) => (
          <input ref={ref} {...props} />
        ));
      `,
      errors: [{ messageId: "missingDisplayName" }]
    }
  ]
});
