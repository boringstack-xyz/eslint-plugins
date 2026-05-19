import {
  RULE_NAME,
  reactImportNamedRule
} from "../../src/rules/reactImportNamed";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, reactImportNamedRule, {
  valid: [
    {
      code: `
        import { FC, useState } from 'react';
      `
    },
    {
      code: `
        import * as React from 'react';
      `
    },
    {
      code: `
        import React, { FC, useState } from 'react';
      `
    }
  ],
  invalid: [
    {
      code: `
        import React from 'react';
      `,
      errors: [{ messageId: "noDefaultImport" }]
    },
    {
      code: `
        import React from 'react';
        import { FC } from 'react';
      `,
      errors: [{ messageId: "noDefaultImport" }]
    }
  ]
});
