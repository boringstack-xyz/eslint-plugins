import {
  RULE_NAME,
  requireInstanceBufferUpdateRule
} from "../../src/rules/require-instance-buffer-update";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireInstanceBufferUpdateRule, {
  valid: [
    {
      code: `import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
const matrix = new Matrix4();
for (let i = 0; i < 10; i++) {
  mesh.setMatrixAt(i, matrix);
}
mesh.instanceMatrix.needsUpdate = true;
`
    },
    {
      code: `import { InstancedMesh, Color } from "three";
const mesh = new InstancedMesh();
const color = new Color();
mesh.setColorAt(0, color);
mesh.instanceColor.needsUpdate = true;
`
    },
    {
      code: `import { Scene } from "three";
const grid = { setMatrixAt(i: number, m: unknown) {} };
grid.setMatrixAt(0, {});
`
    }
  ],
  invalid: [
    {
      code: `import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
const matrix = new Matrix4();
for (let i = 0; i < 10; i++) {
  mesh.setMatrixAt(i, matrix);
}
`,
      output: `import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
const matrix = new Matrix4();
for (let i = 0; i < 10; i++) {
  mesh.setMatrixAt(i, matrix);
}
mesh.instanceMatrix.needsUpdate = true;
`,
      errors: [{ messageId: "missingNeedsUpdate", data: { receiver: "mesh" } }]
    },
    {
      code: `import { InstancedMesh, Color } from "three";
const mesh = new InstancedMesh();
const color = new Color();
mesh.setColorAt(0, color);
`,
      output: `import { InstancedMesh, Color } from "three";
const mesh = new InstancedMesh();
const color = new Color();
mesh.setColorAt(0, color);
mesh.instanceColor.needsUpdate = true;
`,
      errors: [{ messageId: "missingColorNeedsUpdate", data: { receiver: "mesh" } }]
    },
    {
      code: `import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
const matrix = new Matrix4();
function update() {
  mesh.setMatrixAt(0, matrix);
  mesh.setMatrixAt(1, matrix);
}
`,
      output: `import { InstancedMesh, Matrix4 } from "three";
const mesh = new InstancedMesh();
const matrix = new Matrix4();
function update() {
  mesh.setMatrixAt(0, matrix);
mesh.instanceMatrix.needsUpdate = true;
  mesh.setMatrixAt(1, matrix);
}
`,
      errors: [{ messageId: "missingNeedsUpdate", data: { receiver: "mesh" } }]
    }
  ]
});
