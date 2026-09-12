import {
  RULE_NAME,
  noUnboundedDevicePixelRatioRule
} from "../../src/rules/no-unbounded-device-pixel-ratio";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noUnboundedDevicePixelRatioRule, {
  valid: [
    {
      code: `import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
`
    },
    {
      code: `import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(1);
`
    },
    {
      code: `const renderer = { setPixelRatio(n: number) {} };
renderer.setPixelRatio(window.devicePixelRatio);
`
    }
  ],
  invalid: [
    {
      code: `import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
`,
      output: `import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
`,
      errors: [{ messageId: "unboundedPixelRatio", data: { max: "2" } }]
    },
    {
      code: `import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
`,
      output: `import { WebGLRenderer } from "three";
const renderer = new WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
`,
      options: [{ maxPixelRatio: 1.5 }],
      errors: [{ messageId: "unboundedPixelRatio", data: { max: "1.5" } }]
    }
  ]
});
