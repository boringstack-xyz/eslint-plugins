import {
  RULE_NAME,
  requireThreeLoaderErrorPathRule
} from "../../src/rules/require-three-loader-error-path";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, requireThreeLoaderErrorPathRule, {
  valid: [
    {
      code: `import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
loader.load("/model.glb", (gltf) => {
  use(gltf);
}, undefined, (err) => {
  throw err;
});
`
    },
    {
      code: `import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
const gltf = await loader.loadAsync("/model.glb");
`
    },
    {
      code: `import { Scene } from "three";
const loader = { load(url: string, cb: () => void) {} };
loader.load("/x", () => {});
`
    }
  ],
  invalid: [
    {
      code: `import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
loader.load("/model.glb", (gltf) => {
  use(gltf);
});
`,
      errors: [{ messageId: "missingLoaderError", data: { receiver: "loader" } }]
    },
    {
      code: `import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
loader.load("/model.glb", (gltf) => use(gltf), (progress) => track(progress));
`,
      errors: [{ messageId: "missingLoaderError", data: { receiver: "loader" } }]
    }
  ]
});
