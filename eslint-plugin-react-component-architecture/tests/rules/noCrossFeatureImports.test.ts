import {
  RULE_NAME,
  noCrossFeatureImportsRule
} from "../../src/rules/noCrossFeatureImports";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noCrossFeatureImportsRule, {
  valid: [
    {
      filename: "src/features/auth/pages/Login.tsx",
      code: `
        import { useAuth } from "@/lib/hooks/useAuth";
      `
    },
    {
      filename: "src/features/auth/pages/Login.tsx",
      code: `
        import { LoginForm } from "./components/LoginForm";
      `
    },
    {
      filename: "src/features/auth/pages/Login.tsx",
      code: `
        import type { User } from "@/features/profile/types";
      `
    },
    {
      filename: "src/lib/hooks/useCustom.ts",
      code: `
        import { useState } from "react";
      `
    }
  ],
  invalid: [
    {
      filename: "src/features/auth/pages/Login.tsx",
      code: `
        import { profileUtils } from "@/features/profile/utils";
      `,
      errors: [{ messageId: "crossFeatureImport" }]
    },
    {
      filename: "src/features/dashboard/components/Sidebar.tsx",
      code: `
        import { NavItem } from "@/features/auth/components/NavItem";
      `,
      errors: [{ messageId: "crossFeatureImport" }]
    },
    {
      filename: "src/features/orders/api/getOrders.ts",
      code: `
        import { mapUser } from "@/features/users/mappers";
      `,
      errors: [{ messageId: "crossFeatureImport" }]
    }
  ]
});
