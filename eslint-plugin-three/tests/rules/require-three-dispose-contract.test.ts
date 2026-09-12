import {
  RULE_NAME,
  requireThreeDisposeContractRule
} from "../../src/rules/require-three-dispose-contract";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireThreeDisposeContractRule, {
  valid: [
    {
      code: `import { BoxGeometry } from "three";
class GridView {
  private geometry = new BoxGeometry();
  dispose() {
    this.geometry.dispose();
  }
}
`
    },
    {
      code: `import { MeshStandardMaterial } from "three";
class GridView {
  public constructor(private readonly material: MeshStandardMaterial) {}
}
`
    },
    {
      code: `import { Vector3 } from "./math";
class Thing {
  private v = new Vector3();
}
`
    },
    {
      code: `import { Scene, Vector3 } from "three";
class Thing {
  private scene = new Scene();
  private v = new Vector3();
}
`
    },
    {
      code: `import { BoxGeometry } from "three";
class GridView {
  private geometry = new BoxGeometry();
  teardown() {
    this.geometry.dispose();
  }
}
`,
      options: [{ disposeMethodNames: ["teardown"] }]
    }
  ],
  invalid: [
    {
      code: `import { BoxGeometry, MeshBasicMaterial } from "three";
class GridView {
  private geometry = new BoxGeometry();
  private material = new MeshBasicMaterial();
}
`,
      errors: [
        {
          messageId: "missingDispose",
          data: {
            name: "GridView",
            methods: "`dispose`, `destroy`, `onModuleDestroy`"
          }
        }
      ]
    },
    {
      code: `import * as THREE from "three";
class Viewer {
  private renderer: THREE.WebGLRenderer;
  constructor() {
    this.renderer = new THREE.WebGLRenderer();
  }
}
`,
      errors: [{ messageId: "missingDispose" }]
    },
    {
      code: `import { BoxGeometry } from "three";
class GridView {
  private geometry = new BoxGeometry();
  dispose() {
    this.geometry.dispose();
  }
}
`,
      options: [{ disposeMethodNames: ["teardown"] }],
      errors: [
        {
          messageId: "missingDispose",
          data: { name: "GridView", methods: "`teardown`" }
        }
      ]
    }
  ]
});
