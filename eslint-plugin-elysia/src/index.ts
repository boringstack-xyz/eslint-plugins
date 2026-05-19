import type { TSESLint } from "@typescript-eslint/utils";

import { recommendedRules } from "./configs/recommended";
import { rules } from "./rules";
import { consistentStatusViaSetRule } from "./rules/consistentStatusViaSet";
import { noDecorateStateCollisionRule } from "./rules/noDecorateStateCollision";
import { noDirectErrorThrowRule } from "./rules/noDirectErrorThrow";
import { noSeparateModelInterfacesRule } from "./rules/noSeparateModelInterfaces";
import { preferDestructuredContextRule } from "./rules/preferDestructuredContext";
import { preferDirectReturnRule } from "./rules/preferDirectReturn";
import { preferStaticServicesRule } from "./rules/preferStaticServices";
import { preferThrowStatusRule } from "./rules/preferThrowStatus";
import { requireHooksBeforeRoutesRule } from "./rules/requireHooksBeforeRoutes";
import { requirePluginNameRule } from "./rules/requirePluginName";
import { routeMustCheckAbilityRule } from "./rules/routeMustCheckAbility";
import { routeRequiresSchemaRule } from "./rules/routeRequiresSchema";
import { routeRequiresTagRule } from "./rules/routeRequiresTag";

type ElysiaPlugin = TSESLint.FlatConfig.Plugin & {
  configs: Record<string, TSESLint.FlatConfig.Config>;
};

const plugin: ElysiaPlugin = {
  meta: {
    name: "eslint-plugin-elysia",
    version: "0.1.0"
  },
  rules,
  configs: {}
};

plugin.configs.recommended = {
  plugins: {
    elysia: plugin
  },
  rules: recommendedRules
};

export {
  consistentStatusViaSetRule,
  noDecorateStateCollisionRule,
  noDirectErrorThrowRule,
  noSeparateModelInterfacesRule,
  preferDestructuredContextRule,
  preferDirectReturnRule,
  preferStaticServicesRule,
  preferThrowStatusRule,
  requireHooksBeforeRoutesRule,
  requirePluginNameRule,
  routeMustCheckAbilityRule,
  routeRequiresSchemaRule,
  routeRequiresTagRule
};
export { rules };
export const configs = plugin.configs;
export default plugin;
