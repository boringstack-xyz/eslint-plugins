import {
  RULE_NAME,
  preferThreeLoadAsyncRule
} from "../../src/rules/prefer-three-load-async";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, preferThreeLoadAsyncRule, {
  valid: [
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
    },
    {
      code: `const loader = { load(url: string, cb: () => void) {} };
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
}, undefined, (err) => {
  throw err;
});
`,
      errors: [{ messageId: "preferLoadAsync", data: { receiver: "loader" } }]
    },
    {
      code: `import { TextureLoader } from "three";
function run(loader: TextureLoader) {
  loader.load("/a.png", (tex) => use(tex));
}
`,
      errors: [{ messageId: "preferLoadAsync", data: { receiver: "loader" } }]
    }
  ]
});
