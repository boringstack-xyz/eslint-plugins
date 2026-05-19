import {
  RULE_NAME,
  interfacePrefixIRule
} from "../../src/rules/interfacePrefixI";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, interfacePrefixIRule, {
  valid: [
    {
      code: `
        interface IButtonProps {
          disabled?: boolean;
        }
      `
    },
    {
      code: `
        interface IUser {
          id: string;
          name: string;
        }
      `
    },
    {
      code: `
        interface Config extends BaseConfig {
          value: string;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        interface ButtonProps {
          disabled?: boolean;
        }
      `,
      errors: [{ messageId: "mustPrefixI" }]
    },
    {
      code: `
        interface User {
          id: string;
        }
      `,
      errors: [{ messageId: "mustPrefixI" }]
    }
  ]
});
