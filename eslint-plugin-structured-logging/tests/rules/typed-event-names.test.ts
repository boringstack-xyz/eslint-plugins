import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe } from "vitest";

import {
  RULE_NAME,
  typedEventNamesRule
} from "../../src/rules/typed-event-names";
import { ruleTester } from "../test-utils/ruleTester";

const fixtureDir = mkdtempSync(join(tmpdir(), "typed-event-names-"));
const eventsFile = join(fixtureDir, "logger.events.ts");

beforeAll(() => {
  writeFileSync(
    eventsFile,
    `export const LOG_EVENTS = ["a", "b", "c.dotted"] as const;\n`,
    "utf8"
  );
});

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

describe(RULE_NAME, () => {
  ruleTester.run(RULE_NAME, typedEventNamesRule, {
    valid: [
      {
        code: `logger.info({ event: "a", userId: "u1" });`,
        options: [{ eventNamesModule: eventsFile }]
      },
      {
        code: `logger.error({ event: "c.dotted" }, "happened");`,
        options: [{ eventNamesModule: eventsFile }]
      },
      {
        code: "logger.warn({ event: `b` });",
        options: [{ eventNamesModule: eventsFile }]
      },
      {
        code: `logger.info({ userId: "u1" });`,
        options: [{ eventNamesModule: eventsFile }]
      },
      {
        code: `someOtherObj.info({ event: "totally.fake" });`,
        options: [{ eventNamesModule: eventsFile }]
      },
      {
        code: `logger.info({ event: "a" });`,
        options: [{ eventNamesModule: "/no/such/file.ts" }]
      },
      {
        code: `logger.info({ kind: "a" });`,
        options: [{ eventNamesModule: eventsFile, eventField: "kind" }]
      }
    ],
    invalid: [
      {
        code: `logger.info({ event: "totally.fake" });`,
        options: [{ eventNamesModule: eventsFile }],
        errors: [{ messageId: "unknownEventName" }]
      },
      {
        code: `logger.error({ event: "typo" }, "msg");`,
        options: [{ eventNamesModule: eventsFile }],
        errors: [{ messageId: "unknownEventName" }]
      },
      {
        code: `const e = "a"; logger.info({ event: e });`,
        options: [{ eventNamesModule: eventsFile }],
        errors: [{ messageId: "nonLiteralEventValue" }]
      },
      {
        code: "const x = 'b'; logger.info({ event: `${x}` });",
        options: [{ eventNamesModule: eventsFile }],
        errors: [{ messageId: "nonLiteralEventValue" }]
      },
      {
        code: `logger.info({ kind: "totally.fake" });`,
        options: [{ eventNamesModule: eventsFile, eventField: "kind" }],
        errors: [{ messageId: "unknownEventName" }]
      }
    ]
  });
});
