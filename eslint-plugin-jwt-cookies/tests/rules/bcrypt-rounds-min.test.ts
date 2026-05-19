import {
  RULE_NAME,
  bcryptRoundsMinRule
} from "../../src/rules/bcrypt-rounds-min";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, bcryptRoundsMinRule, {
  valid: [
    {
      code: `import bcrypt from "bcrypt"; bcrypt.hash(plain, 12);`
    },
    {
      code: `import bcrypt from "bcryptjs"; bcrypt.hashSync(plain, 10);`
    },
    {
      code: `import bcrypt from "bcrypt"; bcrypt.hash(plain, env.BCRYPT_ROUNDS);`
    },
    {
      code: `import * as bcrypt from "bcrypt"; bcrypt.hash(plain, 14);`
    },
    {
      // Direct named import.
      code: `import { hash } from "bcrypt"; hash(plain, 12);`
    },
    {
      // Not from a tracked module.
      code: `import bcrypt from "some-other-lib"; bcrypt.hash(plain, 4);`
    },
    {
      // Different method on bcrypt — not flagged.
      code: `import bcrypt from "bcrypt"; bcrypt.compare(plain, hashed);`
    },
    {
      code: `import bcrypt from "bcrypt"; bcrypt.hash(plain, 14);`,
      options: [{ minRounds: 14 }]
    }
  ],
  invalid: [
    {
      code: `import bcrypt from "bcrypt"; bcrypt.hash(plain, 8);`,
      errors: [{ messageId: "roundsTooLow" }]
    },
    {
      code: `import bcrypt from "bcryptjs"; bcrypt.hashSync(plain, 4);`,
      errors: [{ messageId: "roundsTooLow" }]
    },
    {
      code: `import * as bcrypt from "bcrypt"; bcrypt.hash(plain, 6);`,
      errors: [{ messageId: "roundsTooLow" }]
    },
    {
      code: `import { hash } from "bcrypt"; hash(plain, 5);`,
      errors: [{ messageId: "roundsTooLow" }]
    },
    {
      code: `import bcrypt from "bcrypt"; bcrypt.hash(plain, 12);`,
      options: [{ minRounds: 14 }],
      errors: [{ messageId: "roundsTooLow" }]
    }
  ]
});
