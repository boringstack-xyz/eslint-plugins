import {
  RULE_NAME,
  preferEarlyReturnRule,
} from "../../src/rules/preferEarlyReturn";
import { preferEarlyReturnErrors } from "../test-utils/applySuggestFix";
import { ruleTester } from "../test-utils/ruleTester";

const guardClauseOutput = (invertedCondition: string, bodyLines: string) =>
  `if (${invertedCondition}) {
  return;
}

${bodyLines}`;

const preferEarlyReturnError = (
  invertedCondition: string,
  hoistedBody: string
) => ({
  messageId: "preferEarlyReturn" as const,
  suggestions: [
    {
      messageId: "preferEarlyReturn" as const,
      output: guardClauseOutput(invertedCondition, hoistedBody)
    }
  ]
});

const invalidWrappedLastIf = (options: {
  name: string;
  preamble?: string;
  condition: string;
  body: string;
  inverted: string;
  hoisted: string;
  wrapper?: (inner: string) => string;
}) => {
  const preamble = options.preamble ?? "";
  const inner = `
        function example() {
          ${preamble}
          if (${options.condition}) {
            ${options.body}
          }
        }
      `;
  const code = options.wrapper ? options.wrapper(inner) : inner;

  return {
    name: options.name,
    code,
    errors: [
      {
        ...preferEarlyReturnError(options.inverted, options.hoisted),
        suggestions: [
          {
            messageId: "preferEarlyReturn" as const,
            output: options.wrapper
              ? options.wrapper(`
        function example() {
          ${preamble}
          ${guardClauseOutput(options.inverted, options.hoisted)}
        }
      `)
              : `
        function example() {
          ${preamble}
          ${guardClauseOutput(options.inverted, options.hoisted)}
        }
      `
          }
        ]
      }
    ]
  };
};

ruleTester.run(RULE_NAME, preferEarlyReturnRule, {
  valid: [
    {
      name: "one-statement consequent",
      code: `
        function dispose() {
          if (ref.client !== null) {
            ref.client.quit();
          }
        }
      `,
    },
    {
      name: "if with else",
      code: `
        function dispose() {
          if (ref.client !== null) {
            ref.client.quit();
            ref.client = null;
          } else {
            ref.client = null;
          }
        }
      `,
    },
    {
      name: "if followed by other code",
      code: `
        function dispose() {
          if (ref.client !== null) {
            ref.client.quit();
            ref.client = null;
          }
          return true;
        }
      `,
    },
    {
      name: "else-if chain",
      code: `
        function pick(x: number) {
          if (x > 0) {
            doPositive();
            doMore();
          } else if (x < 0) {
            doNegative();
            doLess();
          }
        }
      `,
    },
    {
      name: "expression-bodied arrow",
      code: `
        const dispose = () => ref.client?.quit();
      `,
    },
    {
      name: "early return already used elsewhere",
      code: `
        function dispose() {
          if (ref.client === null) {
            return;
          }
          ref.client.quit();
          ref.client = null;
        }
      `,
    },
    {
      name: "nested inner if as the only consequent statement",
      code: `
        function outer() {
          if (ready) {
            if (inner) {
              init();
              start();
            }
          }
        }
      `,
    },
    {
      name: "last statement is switch, not if",
      code: `
        function pick(mode: string) {
          switch (mode) {
            case "a":
              runA();
              runB();
              break;
            default:
              runDefault();
          }
        }
      `,
    },
    {
      name: "last statement is while, not if",
      code: `
        function drain(queue: string[]) {
          while (queue.length > 0) {
            if (queue[0]) {
              process(queue[0]);
              archive(queue[0]);
            }
          }
        }
      `,
    },
    {
      name: "wrapped if only inside try when try is last",
      code: `
        function risky() {
          try {
            if (ready) {
              init();
              start();
            }
          } catch {
            recover();
          }
        }
      `,
    },
    {
      name: "generator with single-statement consequent",
      code: `
        function* stream() {
          if (open) {
            yield next();
          }
        }
      `,
    },
    {
      name: "if with empty consequent block",
      code: `
        function noop(flag: boolean) {
          if (flag) {
          }
        }
      `,
    },
    {
      name: "if with only return statements in consequent but count is one",
      code: `
        function maybeReturn(flag: boolean) {
          if (flag) {
            return 1;
          }
        }
      `,
    },
    {
      name: "consequent uses expression statement sequence via single return",
      code: `
        function compact(flag: boolean) {
          if (flag) return work(), finalize();
        }
      `,
    },
    {
      name: "leading guard then unwrapped happy path is not the pattern",
      code: `
        function guarded(flag: boolean) {
          if (!flag) {
            return;
          }
          doFirst();
          doSecond();
        }
      `,
    },
    {
      name: "class field arrow with single-statement consequent",
      code: `
        class Worker {
          run = () => {
            if (this.ready) {
              this.start();
            }
          };
        }
      `,
    },
    {
      name: "callback with single-statement consequent",
      code: `
        items.forEach((item) => {
          if (item.active) {
            process(item);
          }
        });
      `,
    },
    {
      name: "exported function with else",
      code: `
        export function pick(x: number) {
          if (x > 0) {
            doPositive();
            doMore();
          } else {
            doNegative();
          }
        }
      `,
    },
    {
      name: "if with null alternate via else-if only on first branch",
      code: `
        function classify(x: number) {
          if (x > 10) {
            bucketLarge();
            finalizeLarge();
          } else if (x > 0) {
            bucketSmall();
            finalizeSmall();
          }
        }
      `,
    },
  ],
  invalid: [
    {
      name: "function declaration",
      code: `
        async function dispose(): Promise<void> {
          if (ref.client !== null) {
            await ref.client.quit();
            ref.client = null;
          }
        }
      `,
      errors: [
        {
          messageId: "preferEarlyReturn",
          suggestions: [
            {
              messageId: "preferEarlyReturn",
              output: `
        async function dispose(): Promise<void> {
          ${guardClauseOutput(
            "ref.client === null",
            "await ref.client.quit();\nref.client = null;"
          )}
        }
      `,
            },
          ],
        },
      ],
    },
    {
      name: "arrow function",
      code: `
        const dispose = async () => {
          if (ref.client !== null) {
            await ref.client.quit();
            ref.client = null;
          }
        };
      `,
      errors: [
        {
          messageId: "preferEarlyReturn",
          suggestions: [
            {
              messageId: "preferEarlyReturn",
              output: `
        const dispose = async () => {
          ${guardClauseOutput(
            "ref.client === null",
            "await ref.client.quit();\nref.client = null;"
          )}
        };
      `,
            },
          ],
        },
      ],
    },
    {
      name: "method definition",
      code: `
        class ClientHolder {
          async dispose(): Promise<void> {
            if (this.client !== null) {
              await this.client.quit();
              this.client = null;
            }
          }
        }
      `,
      errors: [
        {
          messageId: "preferEarlyReturn",
          suggestions: [
            {
              messageId: "preferEarlyReturn",
              output: `
        class ClientHolder {
          async dispose(): Promise<void> {
            ${guardClauseOutput(
              "this.client === null",
              "await this.client.quit();\nthis.client = null;"
            )}
          }
        }
      `,
            },
          ],
        },
      ],
    },
    {
      name: "function expression",
      code: `
        const dispose = async function dispose(): Promise<void> {
          if (ref.client !== null) {
            await ref.client.quit();
            ref.client = null;
          }
        };
      `,
      errors: [
        {
          messageId: "preferEarlyReturn",
          suggestions: [
            {
              messageId: "preferEarlyReturn",
              output: `
        const dispose = async function dispose(): Promise<void> {
          ${guardClauseOutput(
            "ref.client === null",
            "await ref.client.quit();\nref.client = null;"
          )}
        };
      `,
            },
          ],
        },
      ],
    },
    {
      name: "suggest inverts condition and hoists body",
      code: `
        function reset(flag: boolean) {
          if (flag) {
            doFirst();
            doSecond();
          }
        }
      `,
      errors: [
        {
          messageId: "preferEarlyReturn",
          suggestions: [
            {
              messageId: "preferEarlyReturn",
              output: `
        function reset(flag: boolean) {
          ${guardClauseOutput("!flag", "doFirst();\ndoSecond();")}
        }
      `,
            },
          ],
        },
      ],
    },
    {
      name: "de morgan for logical and",
      code: `
        function run(a: boolean, b: boolean) {
          if (a && b) {
            stepOne();
            stepTwo();
          }
        }
      `,
      errors: [
        {
          messageId: "preferEarlyReturn",
          suggestions: [
            {
              messageId: "preferEarlyReturn",
              output: `
        function run(a: boolean, b: boolean) {
          ${guardClauseOutput("!a || !b", "stepOne();\nstepTwo();")}
        }
      `,
            },
          ],
        },
      ],
    },
    invalidWrappedLastIf({
      name: "statements before wrapped last if",
      preamble: "const token = getToken();",
      condition: "token !== null",
      body: "consume(token);\nrelease(token);",
      inverted: "token === null",
      hoisted: "consume(token);\nrelease(token);"
    }),
    invalidWrappedLastIf({
      name: "leading guard does not block wrapped last if",
      preamble: "if (!enabled) {\n            return;\n          }",
      condition: "ready",
      body: "init();\nstart();",
      inverted: "!ready",
      hoisted: "init();\nstart();"
    }),
    invalidWrappedLastIf({
      name: "three-statement consequent",
      condition: "ready",
      body: "init();\nstart();\nfinalize();",
      inverted: "!ready",
      hoisted: "init();\nstart();\nfinalize();"
    }),
    invalidWrappedLastIf({
      name: "negated condition",
      condition: "!ready",
      body: "init();\nstart();",
      inverted: "ready",
      hoisted: "init();\nstart();"
    }),
    invalidWrappedLastIf({
      name: "comparison condition",
      condition: "count > 0",
      body: "process(count);\nreset(count);",
      inverted: "count <= 0",
      hoisted: "process(count);\nreset(count);"
    }),
    invalidWrappedLastIf({
      name: "optional chaining condition",
      condition: "user?.active",
      body: "notify(user);\nlog(user);",
      inverted: "!user?.active",
      hoisted: "notify(user);\nlog(user);"
    }),
    invalidWrappedLastIf({
      name: "de morgan for logical or",
      condition: "a || b",
      body: "stepOne();\nstepTwo();",
      inverted: "!a && !b",
      hoisted: "stepOne();\nstepTwo();"
    }),
    invalidWrappedLastIf({
      name: "consequent with two returns",
      condition: "flag",
      body: "return 1;\nreturn 2;",
      inverted: "!flag",
      hoisted: "return 1;\nreturn 2;"
    }),
    invalidWrappedLastIf({
      name: "empty statement plus real statement in consequent",
      condition: "ready",
      body: ";\nstart();",
      inverted: "!ready",
      hoisted: ";\nstart();"
    }),
    ...[
      {
        name: "generator function",
        code: `
        function* produce() {
          if (open) {
            yield prepare();
            yield finalize();
          }
        }
      `
      },
      {
        name: "exported async function",
        code: `
        export async function dispose(client: { close(): Promise<void> } | null) {
          if (client !== null) {
            await client.close();
            logClosed();
          }
        }
      `
      },
      {
        name: "constructor",
        code: `
        class Service {
          constructor(private readonly enabled: boolean) {
            if (enabled) {
              this.connect();
              this.listen();
            }
          }
        }
      `
      },
      {
        name: "class getter",
        code: `
        class Config {
          get active() {
            if (this.flag) {
              this.validate();
              return this.value;
            }
          }
        }
      `
      },
      {
        name: "class field arrow",
        code: `
        class Worker {
          run = () => {
            if (this.ready) {
              this.prepare();
              this.start();
            }
          };
        }
      `
      },
      {
        name: "object literal method",
        code: `
        const api = {
          dispose() {
            if (this.handle) {
              this.handle.close();
              this.handle = null;
            }
          },
        };
      `
      },
      {
        name: "iife",
        code: `
        (function run() {
          if (ready) {
            init();
            start();
          }
        })();
      `
      },
      {
        name: "callback passed to array map",
        code: `
        items.map((item) => {
          if (item.enabled) {
            process(item);
            archive(item);
          }
        });
      `
      },
      {
        name: "instanceof condition",
        code: `
        function handle(value: unknown) {
          if (value instanceof Error) {
            log(value);
            throw value;
          }
        }
      `
      },
      {
        name: "in operator condition",
        code: `
        function handle(value: object) {
          if ("code" in value) {
            log(value);
            track(value);
          }
        }
      `
      }
    ].map((testCase) => ({
      name: testCase.name,
      code: testCase.code,
      errors: preferEarlyReturnErrors(testCase.code)
    })),
    {
      name: "nested inner function reports separately",
      code: `
        function outer() {
          function inner() {
            if (ready) {
              init();
              start();
            }
          }
          return inner;
        }
      `,
      errors: preferEarlyReturnErrors(`
        function outer() {
          function inner() {
            if (ready) {
              init();
              start();
            }
          }
          return inner;
        }
      `)
    },
    {
      name: "only outer function reports when both match",
      code: `
        function outer() {
          function inner() {
            if (a) {
              one();
            }
          }
          if (b) {
            two();
            three();
          }
        }
      `,
      errors: preferEarlyReturnErrors(
        `
        function outer() {
          function inner() {
            if (a) {
              one();
            }
          }
          if (b) {
            two();
            three();
          }
        }
      `,
        1
      )
    }
  ],
});
