import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { noDirectChildrenMutationRule } from "./rules/no-direct-children-mutation";
import { noDisabledFrustumCullingRule } from "./rules/no-disabled-frustum-culling";
import { noGlobalThreeRule } from "./rules/no-global-three";
import { noMixedThreeEntrypointsRule } from "./rules/no-mixed-three-entrypoints";
import { noUnboundedDevicePixelRatioRule } from "./rules/no-unbounded-device-pixel-ratio";
import { preferNamedThreeImportsRule } from "./rules/prefer-named-three-imports";
import { preferThreeLoadAsyncRule } from "./rules/prefer-three-load-async";
import { requireInstanceBufferUpdateRule } from "./rules/require-instance-buffer-update";
import { requireProjectionUpdateRule } from "./rules/require-projection-update";
import { requireThreeDisposeContractRule } from "./rules/require-three-dispose-contract";
import { requireThreeLoaderErrorPathRule } from "./rules/require-three-loader-error-path";

type ThreePlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: ThreePlugin = {
  meta: {
    name: "eslint-plugin-three",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    three: plugin
  },
  rules: recommendedRules
};

export {
  noDirectChildrenMutationRule,
  noDisabledFrustumCullingRule,
  noGlobalThreeRule,
  noMixedThreeEntrypointsRule,
  noUnboundedDevicePixelRatioRule,
  preferNamedThreeImportsRule,
  preferThreeLoadAsyncRule,
  requireInstanceBufferUpdateRule,
  requireProjectionUpdateRule,
  requireThreeDisposeContractRule,
  requireThreeLoaderErrorPathRule
};
export type { NoUnboundedDevicePixelRatioOptions } from "./rules/no-unbounded-device-pixel-ratio";
export type { RequireThreeDisposeContractOptions } from "./rules/require-three-dispose-contract";
export { rules };
export const configs = plugin.configs;
export default plugin;
