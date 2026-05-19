import {
  RULE_NAME,
  propsMustBeVisualRule
} from "../../src/rules/propsMustBeVisual";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, propsMustBeVisualRule, {
  valid: [
    {
      code: `
        interface IButtonProps {
          disabled?: boolean;
          isLoading?: boolean;
          variant?: 'primary' | 'secondary';
        }
      `
    },
    {
      code: `
        interface ICardProps {
          title: string;
          content: ReactNode;
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        interface IButtonProps {
          userId: string;
          isAuthenticated: boolean;
        }
      `,
      errors: [{ messageId: "businessLogicInProps" }, { messageId: "businessLogicInProps" }]
    },
    {
      code: `
        interface IUserCardProps {
          currentUser: User;
          authToken: string;
        }
      `,
      errors: [{ messageId: "businessLogicInProps" }, { messageId: "businessLogicInProps" }]
    }
  ]
});
