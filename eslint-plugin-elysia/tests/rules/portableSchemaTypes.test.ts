import {
  RULE_NAME,
  portableSchemaTypesRule
} from "../../src/rules/portableSchemaTypes";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, portableSchemaTypesRule, {
  valid: [
    {
      // TypeBox's own Integer publishes as `{ type: "integer" }`.
      filename: "src/api/catalog/catalog.schemas.ts",
      code: `
        import { t } from "elysia";
        import { Type } from "@sinclair/typebox";
        export const Resistor = t.Object({ resistanceOhm: Type.Integer(), tolerance: t.Number() });
      `
    },
    {
      filename: "src/api/projects/projects.schemas.ts",
      code: `
        import { t } from "elysia";
        const STATUSES = ["draft", "published"] as const;
        export const Status = t.UnionEnum([...STATUSES]);
        export const Spelled = t.Union([t.Literal("draft"), t.Literal("published")]);
        export const Pairs = t.Array(t.Array(t.String()));
      `
    },
    {
      // Env parsing wants coercion from strings; it is not a contract file.
      filename: "src/config/env/schema.ts",
      code: `
        import { t } from "elysia";
        export const Env = t.Object({ PORT: t.Integer({ default: 7330 }) });
      `
    },
    {
      // Another module's \`t\` is not Elysia's.
      filename: "src/api/other/other.schemas.ts",
      code: `
        import { t } from "./builders";
        export const X = t.Integer();
      `
    }
  ],
  invalid: [
    {
      filename: "src/api/catalog/catalog.schemas.ts",
      code: `
        import { t } from "elysia";
        export const Resistor = t.Object({ resistanceOhm: t.Integer() });
      `,
      errors: [{ messageId: "coercingInteger" }]
    },
    {
      filename: "src/api/catalog/catalog.schemas.ts",
      code: `
        import { t as schema } from "elysia";
        export const Pair = schema.Tuple([schema.String(), schema.String()]);
      `,
      errors: [{ messageId: "tupleSchema" }]
    },
    {
      filename: "src/api/projects/projects.schemas.ts",
      code: `
        import { t } from "elysia";
        const STATUSES = ["draft", "published"] as const;
        export const Status = t.Union(STATUSES.map((s) => t.Literal(s)));
      `,
      errors: [{ messageId: "mappedLiteralUnion" }]
    },
    {
      filename: "src/contracts/things.ts",
      options: [{ fileGlob: "**/contracts/**" }],
      code: `
        import { t } from "elysia";
        export const Count = t.Integer();
      `,
      errors: [{ messageId: "coercingInteger" }]
    }
  ]
});
