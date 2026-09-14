import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { afterAll } from "vitest";
import {
  RULE_NAME,
  componentFolderStructureRule
} from "../../src/rules/componentFolderStructure";
import { ruleTester } from "../test-utils/ruleTester";

// The rule checks siblings on disk, so the cases point at a real directory:
// `Complete/` carries every required sibling, `Bare/` carries none. It lives
// under the package root because the flat-config RuleTester only lints files
// inside cwd, and outside `tests/`, which the rule ignores by default.
const root = mkdtempSync(join(process.cwd(), ".rca-folder-structure-"));
const complete = join(root, "src/components/core/Complete");
const bare = join(root, "src/components/core/Bare");

mkdirSync(complete, { recursive: true });
mkdirSync(bare, { recursive: true });

for (const sibling of [
  "Complete.hooks.ts",
  "Complete.types.ts",
  "Complete.stories.tsx",
  "Complete.test.ts",
  "index.ts"
]) {
  writeFileSync(join(complete, sibling), "export {};\n");
}

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

ruleTester.run(RULE_NAME, componentFolderStructureRule, {
  valid: [
    {
      // Every sibling present.
      filename: join(complete, "Complete.tsx"),
      code: `export const Complete = () => <div />;`
    },
    {
      // Exports nothing: an internal helper of the component beside it,
      // not a component with a public surface of its own.
      filename: join(bare, "BareArt.tsx"),
      code: `
        const BareArt = () => <svg />;
        void BareArt;
      `
    },
    {
      // Lowercase basename is not a component file.
      filename: join(bare, "helpers.tsx"),
      code: `export const helper = () => <div />;`
    },
    {
      filename: join(bare, "Bare.test.tsx"),
      code: `export const x = 1;`
    }
  ],
  invalid: [
    {
      filename: join(bare, "Bare.tsx"),
      code: `export const Bare = () => <div />;`,
      errors: [
        {
          messageId: "missingSiblings",
          data: {
            name: "Bare",
            missing:
              "Bare.hooks.ts, Bare.types.ts, Bare.stories.tsx, Bare.test.ts, index.ts"
          }
        }
      ]
    },
    {
      filename: join(bare, "Bare.tsx"),
      code: `export default function Bare() { return <div />; }`,
      errors: [{ messageId: "missingSiblings" }]
    }
  ]
});
