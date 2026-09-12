import { noDirectChildrenMutationRule } from "./no-direct-children-mutation";
import { noDisabledFrustumCullingRule } from "./no-disabled-frustum-culling";
import { noGlobalThreeRule } from "./no-global-three";
import { noMixedThreeEntrypointsRule } from "./no-mixed-three-entrypoints";
import { noUnboundedDevicePixelRatioRule } from "./no-unbounded-device-pixel-ratio";
import { preferNamedThreeImportsRule } from "./prefer-named-three-imports";
import { preferThreeLoadAsyncRule } from "./prefer-three-load-async";
import { requireInstanceBufferUpdateRule } from "./require-instance-buffer-update";
import { requireProjectionUpdateRule } from "./require-projection-update";
import { requireThreeDisposeContractRule } from "./require-three-dispose-contract";
import { requireThreeLoaderErrorPathRule } from "./require-three-loader-error-path";

export const rules = {
  "no-direct-children-mutation": noDirectChildrenMutationRule,
  "no-disabled-frustum-culling": noDisabledFrustumCullingRule,
  "no-global-three": noGlobalThreeRule,
  "no-mixed-three-entrypoints": noMixedThreeEntrypointsRule,
  "no-unbounded-device-pixel-ratio": noUnboundedDevicePixelRatioRule,
  "prefer-named-three-imports": preferNamedThreeImportsRule,
  "prefer-three-load-async": preferThreeLoadAsyncRule,
  "require-instance-buffer-update": requireInstanceBufferUpdateRule,
  "require-projection-update": requireProjectionUpdateRule,
  "require-three-dispose-contract": requireThreeDisposeContractRule,
  "require-three-loader-error-path": requireThreeLoaderErrorPathRule
};
