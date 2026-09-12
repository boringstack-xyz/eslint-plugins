import {
  RULE_NAME,
  requireProjectionUpdateRule
} from "../../src/rules/require-projection-update";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireProjectionUpdateRule, {
  valid: [
    {
      code: `import { PerspectiveCamera } from "three";
const camera = new PerspectiveCamera();
function resize() {
  camera.aspect = 1.5;
  camera.updateProjectionMatrix();
}
`
    },
    {
      code: `import { Scene } from "three";
const scene = new Scene();
const img = { aspect: 0 };
img.aspect = 1;
`
    },
    {
      code: `const camera = { aspect: 1 };
camera.aspect = 2;
`
    }
  ],
  invalid: [
    {
      code: `import { PerspectiveCamera } from "three";
const camera = new PerspectiveCamera();
camera.aspect = 1.5;
`,
      output: `import { PerspectiveCamera } from "three";
const camera = new PerspectiveCamera();
camera.aspect = 1.5; camera.updateProjectionMatrix();
`,
      errors: [{ messageId: "missingProjectionUpdate", data: { receiver: "camera" } }]
    },
    {
      code: `import * as THREE from "three";
class Viewport {
  private camera = new THREE.PerspectiveCamera();
  resize(width: number, height: number) {
    this.camera.aspect = width / height;
  }
}
`,
      output: `import * as THREE from "three";
class Viewport {
  private camera = new THREE.PerspectiveCamera();
  resize(width: number, height: number) {
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }
}
`,
      errors: [{ messageId: "missingProjectionUpdate", data: { receiver: "this.camera" } }]
    }
  ]
});
