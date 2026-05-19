import { consistentStatusViaSetRule } from "./consistentStatusViaSet";
import { noDecorateStateCollisionRule } from "./noDecorateStateCollision";
import { noDirectErrorThrowRule } from "./noDirectErrorThrow";
import { noSeparateModelInterfacesRule } from "./noSeparateModelInterfaces";
import { preferDestructuredContextRule } from "./preferDestructuredContext";
import { preferDirectReturnRule } from "./preferDirectReturn";
import { preferStaticServicesRule } from "./preferStaticServices";
import { preferThrowStatusRule } from "./preferThrowStatus";
import { requireHooksBeforeRoutesRule } from "./requireHooksBeforeRoutes";
import { requirePluginNameRule } from "./requirePluginName";
import { routeMustCheckAbilityRule } from "./routeMustCheckAbility";
import { routeRequiresSchemaRule } from "./routeRequiresSchema";
import { routeRequiresTagRule } from "./routeRequiresTag";

export const rules = {
  "route-requires-schema": routeRequiresSchemaRule,
  "route-requires-tag": routeRequiresTagRule,
  "no-direct-error-throw": noDirectErrorThrowRule,
  "consistent-status-via-set": consistentStatusViaSetRule,
  "prefer-destructured-context": preferDestructuredContextRule,
  "require-plugin-name": requirePluginNameRule,
  "no-separate-model-interfaces": noSeparateModelInterfacesRule,
  "prefer-static-services": preferStaticServicesRule,
  "require-hooks-before-routes": requireHooksBeforeRoutesRule,
  "prefer-throw-status": preferThrowStatusRule,
  "prefer-direct-return": preferDirectReturnRule,
  "no-decorate-state-collision": noDecorateStateCollisionRule,
  "route-must-check-ability": routeMustCheckAbilityRule
};
