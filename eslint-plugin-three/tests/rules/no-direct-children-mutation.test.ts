import {
  RULE_NAME,
  noDirectChildrenMutationRule
} from "../../src/rules/no-direct-children-mutation";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noDirectChildrenMutationRule, {
  valid: [
    {
      code: `import { Scene, Mesh } from "three";
const scene = new Scene();
const mesh = new Mesh();
scene.add(mesh);
`
    },
    {
      code: `const list = { children: [] as object[] };
list.children.push({});
`
    },
    {
      code: `import { Scene } from "three";
const list = { children: [] as object[] };
list.children.push({});
`
    }
  ],
  invalid: [
    {
      code: `import { Scene, Mesh } from "three";
const scene = new Scene();
const mesh = new Mesh();
scene.children.push(mesh);
`,
      output: `import { Scene, Mesh } from "three";
const scene = new Scene();
const mesh = new Mesh();
scene.add(mesh);
`,
      errors: [{ messageId: "childrenPush", data: { receiver: "scene" } }]
    },
    {
      code: `import { Scene } from "three";
const scene = new Scene();
scene.children.splice(0, 1);
`,
      output: null,
      errors: [{ messageId: "childrenMutate", data: { receiver: "scene" } }]
    },
    {
      code: `import { Scene } from "three";
const scene = new Scene();
scene.children = [];
`,
      output: null,
      errors: [{ messageId: "childrenMutate", data: { receiver: "scene" } }]
    },
    {
      code: `import * as THREE from "three";
class View {
  private root = new THREE.Group();
  replace(mesh: THREE.Mesh) {
    this.root.children[0] = mesh;
  }
}
`,
      output: null,
      errors: [{ messageId: "childrenMutate", data: { receiver: "this.root" } }]
    }
  ]
});
