import {
  RULE_NAME,
  noDisabledFrustumCullingRule
} from "../../src/rules/no-disabled-frustum-culling";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDisabledFrustumCullingRule, {
  valid: [
    {
      code: `import { Mesh } from "three";
const mesh = new Mesh();
mesh.frustumCulled = true;
`
    },
    {
      code: `const mesh = { frustumCulled: true };
mesh.frustumCulled = false;
`
    },
    {
      code: `import { Scene } from "three";
const mesh = { frustumCulled: true };
mesh.frustumCulled = false;
`
    }
  ],
  invalid: [
    {
      code: `import { Mesh } from "three";
const mesh = new Mesh();
mesh.frustumCulled = false;
`,
      errors: [{ messageId: "frustumCulledDisabled", data: { receiver: "mesh" } }]
    },
    {
      code: `import * as THREE from "three";
class View {
  private points = new THREE.Points();
  init() {
    this.points.frustumCulled = false;
  }
}
`,
      errors: [{ messageId: "frustumCulledDisabled", data: { receiver: "this.points" } }]
    }
  ]
});
