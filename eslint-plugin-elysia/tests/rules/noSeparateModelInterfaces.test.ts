import {
  RULE_NAME,
  noSeparateModelInterfacesRule
} from "../../src/rules/noSeparateModelInterfaces";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noSeparateModelInterfacesRule, {
  valid: [
    {
      code: `
        import { t } from "elysia";
        const UserSchema = t.Object({ id: t.String() });
        type User = typeof UserSchema.static;
      `
    },
    {
      code: `
        import { z } from "zod";
        const UserSchema = z.object({ id: z.string() });
        type User = z.infer<typeof UserSchema>;
      `
    },
    {
      code: `
        interface NoMatchingSchema { id: string; }
      `
    },
    {
      code: `
        import { t } from "elysia";
        const ProjectSchema = t.Object({});
        interface User { id: string; }
      `
    }
  ],
  invalid: [
    {
      code: `
        import { t } from "elysia";
        const UserSchema = t.Object({ id: t.String() });
        interface User { id: string; }
      `,
      errors: [{ messageId: "noSeparateModelInterface", data: { interface: "User", schema: "UserSchema" } }]
    },
    {
      code: `
        import { z } from "zod";
        export const CreateUserDto = z.object({ email: z.string() });
        export interface CreateUser { email: string; }
      `,
      errors: [{ messageId: "noSeparateModelInterface", data: { interface: "CreateUser", schema: "CreateUserDto" } }]
    },
    {
      code: `
        import { Type } from "@sinclair/typebox";
        const ProductModel = Type.Object({ id: Type.String() });
        interface ProductResponse { id: string; }
      `,
      errors: [{ messageId: "noSeparateModelInterface", data: { interface: "ProductResponse", schema: "ProductModel" } }]
    },
    {
      code: `
        import { v } from "valibot";
        const SignupRequest = v.object({});
        interface Signup {}
      `,
      errors: [{ messageId: "noSeparateModelInterface", data: { interface: "Signup", schema: "SignupRequest" } }]
    }
  ]
});
