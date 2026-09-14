import {
  RULE_NAME,
  noMixedThreeEntrypointsRule
} from "../../src/rules/no-mixed-three-entrypoints";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noMixedThreeEntrypointsRule, {
  valid: [
    { code: `import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";` },
    { code: `import { Scene } from "three";` },
    { code: `import { Vector3 } from "./math";` },
    { code: `const x = await import("three/addons/controls/OrbitControls.js");` }
  ],
  invalid: [
    {
      code: `import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";`,
      output: `import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";`,
      errors: [{ messageId: "legacyExamplesJsm" }]
    },
    {
      code: `export { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";`,
      output: `export { OrbitControls } from "three/addons/controls/OrbitControls.js";`,
      errors: [{ messageId: "legacyExamplesJsm" }]
    },
    {
      code: `export * from "three/examples/jsm/controls/OrbitControls.js";`,
      output: `export * from "three/addons/controls/OrbitControls.js";`,
      errors: [{ messageId: "legacyExamplesJsm" }]
    },
    {
      code: `const mod = await import("three/examples/jsm/controls/OrbitControls.js");`,
      output: `const mod = await import("three/addons/controls/OrbitControls.js");`,
      errors: [{ messageId: "legacyExamplesJsm" }]
    },
    {
      code: `const mod = require("three/examples/jsm/controls/OrbitControls.js");`,
      output: `const mod = require("three/addons/controls/OrbitControls.js");`,
      errors: [{ messageId: "legacyExamplesJsm" }]
    },
    {
      code: `import { Scene } from "three/src/scenes/Scene.js";`,
      output: null,
      errors: [{ messageId: "srcEntrypoint" }]
    },
    {
      code: `import * as THREE from "three/build/three.module.js";`,
      output: null,
      errors: [{ messageId: "srcEntrypoint" }]
    },
    {
      code: `import * as THREE from "https://unpkg.com/three/build/three.module.js";`,
      output: null,
      errors: [{ messageId: "cdnEntrypoint" }]
    }
  ]
});
