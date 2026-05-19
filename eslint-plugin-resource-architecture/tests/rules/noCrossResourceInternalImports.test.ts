import {
  RULE_NAME,
  __resetFsAdapterForTests,
  __setFsAdapterForTests,
  noCrossResourceInternalImportsRule
} from "../../src/rules/noCrossResourceInternalImports";
import { ruleTester } from "../test-utils/ruleTester";

__setFsAdapterForTests({
  existsSync: (filename) => {
    const normalized = filename.replaceAll("\\", "/");
    return (
      normalized.endsWith("src/api/projects/projects.service.ts") ||
      normalized.endsWith("src/api/projects/projects.routes.ts") ||
      normalized.endsWith("src/api/projects/index.ts")
    );
  }
});

ruleTester.run(RULE_NAME, noCrossResourceInternalImportsRule, {
  valid: [
    {
      filename: "src/api/users/users.routes.ts",
      code: `import { projectRoutes } from "../projects/projects.routes"; export { projectRoutes };`
    },
    {
      filename: "src/api/users/users.routes.ts",
      code: `import * as projects from "../projects/index"; export { projects };`
    },
    {
      filename: "src/api/users/users.routes.ts",
      code: `import { local } from "./users.service"; export { local };`
    }
  ],
  invalid: [
    {
      filename: "src/api/users/users.routes.ts",
      code: `import { projectService } from "../projects/projects.service"; export { projectService };`,
      errors: [{ messageId: "crossResourceInternal" }]
    },
    {
      filename: "src/api/users/users.routes.ts",
      code: `export { projectService } from "../projects/projects.service";`,
      errors: [{ messageId: "crossResourceInternal" }]
    },
    {
      filename: "src/api/users/users.routes.ts",
      code: `import { projectService } from "../projects/projects.service"; export { projectService };`,
      options: [{ publicSurface: ["index.ts"] }],
      errors: [{ messageId: "crossResourceInternal" }]
    }
  ]
});

__resetFsAdapterForTests();

