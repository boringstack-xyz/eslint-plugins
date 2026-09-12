import { RULE_NAME, noGlobalThreeRule } from "../../src/rules/no-global-three";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noGlobalThreeRule, {
  valid: [
    {
      code: `import * as THREE from "three";
const v = new THREE.Vector3();
`
    },
    {
      code: `import { Vector3 } from "./math";
const v = new Vector3();
`
    },
    {
      code: `import THREE from "three";
const v = new THREE.Vector3();
`
    },
    {
      code: `import type { Object3D } from "three";
declare const scene: Object3D;
console.log(scene.THREE);
`
    },
    {
      code: `const mod = require("./three-helpers");`
    }
  ],
  invalid: [
    {
      code: `const v = new THREE.Vector3();`,
      errors: [{ messageId: "globalThree" }]
    },
    {
      code: `const THREE = require("three");`,
      errors: [{ messageId: "requireThree" }]
    },
    {
      code: `const { OrbitControls } = require("three/addons/controls/OrbitControls.js");`,
      errors: [{ messageId: "requireThree" }]
    }
  ]
});
