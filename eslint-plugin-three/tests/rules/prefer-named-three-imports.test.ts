import {
  RULE_NAME,
  preferNamedThreeImportsRule
} from "../../src/rules/prefer-named-three-imports";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, preferNamedThreeImportsRule, {
  valid: [
    {
      code: `
import { Vector3, Color } from "three";
const v = new Vector3();
const c = new Color();
`
    },
    {
      code: `
import { Vector3 } from "./math";
const v = new Vector3();
`
    },
    {
      code: `import * as Utils from "./utils";\nUtils.run();`
    }
  ],
  invalid: [
    {
      code: `import * as THREE from "three";
const v = new THREE.Vector3();
const c = new THREE.Color();
`,
      output: `import { Color, Vector3 } from "three";
const v = new Vector3();
const c = new Color();
`,
      errors: [{ messageId: "preferNamedImports", data: { name: "THREE" } }]
    },
    {
      code: `import * as THREE from "three";
use(THREE);
`,
      output: null,
      errors: [{ messageId: "preferNamedImports", data: { name: "THREE" } }]
    },
    {
      code: `import * as THREE from "three";
const name = "Vector3";
const Ctor = THREE[name];
`,
      output: null,
      errors: [{ messageId: "preferNamedImports", data: { name: "THREE" } }]
    },
    {
      code: `import * as THREE from "three";
const Vector3 = 1;
const v = new THREE.Vector3();
`,
      output: null,
      errors: [{ messageId: "preferNamedImports", data: { name: "THREE" } }]
    },
    {
      code: `import * as THREE from "three";
import { Color } from "three";
const v = new THREE.Vector3();
`,
      output: null,
      errors: [{ messageId: "preferNamedImports", data: { name: "THREE" } }]
    }
  ]
});
