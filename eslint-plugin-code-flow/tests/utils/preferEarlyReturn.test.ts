import * as parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import {
  buildGuardClauseReplacement,
  findWrappedHappyPathIf,
  getFunctionBlockBody,
  negateTestExpression
} from "../../src/utils/preferEarlyReturn";

function parseFunctionBody(code: string): ReturnType<typeof findWrappedHappyPathIf> {
  const ast = parser.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module"
  });
  const fn = ast.body[0];

  if (fn === undefined || fn.type !== "FunctionDeclaration") {
    throw new Error("expected a single function declaration");
  }

  const body = getFunctionBlockBody(fn);

  if (body === null) {
    return null;
  }

  return findWrappedHappyPathIf(body);
}

function parseSource(code: string) {
  const codeText = code;
  const ast = parser.parse(codeText, {
    ecmaVersion: "latest",
    sourceType: "module"
  });

  return {
    ast,
    getText(node: { range?: [number, number] }): string {
      if (node.range === undefined) {
        return "";
      }
      return codeText.slice(node.range[0], node.range[1]);
    }
  };
}

describe("findWrappedHappyPathIf", () => {
  it("returns the if when it is the only statement with a multi-statement consequent", () => {
    const wrapped = parseFunctionBody(`
      function f() {
        if (ready) {
          init();
          start();
        }
      }
    `);

    expect(wrapped?.type).toBe("IfStatement");
  });

  it("returns the if when it is the last statement after other top-level statements", () => {
    const wrapped = parseFunctionBody(`
      function f() {
        const token = getToken();
        if (ready) {
          init();
          start();
        }
      }
    `);

    expect(wrapped?.type).toBe("IfStatement");
  });

  it("returns null when the if is not the last statement", () => {
    expect(
      parseFunctionBody(`
        function f() {
          if (ready) {
            init();
            start();
          }
          return token;
        }
      `)
    ).toBeNull();
  });

  it("returns null for a single-statement consequent", () => {
    expect(
      parseFunctionBody(`
        function f() {
          if (ready) {
            init();
          }
        }
      `)
    ).toBeNull();
  });

  it("returns null when an else branch is present", () => {
    expect(
      parseFunctionBody(`
        function f() {
          if (ready) {
            init();
            start();
          } else {
            shutdown();
          }
        }
      `)
    ).toBeNull();
  });

  it("returns null when an else-if chain provides an alternate", () => {
    expect(
      parseFunctionBody(`
        function f(x: number) {
          if (x > 0) {
            init();
            start();
          } else if (x < 0) {
            rollback();
            cleanup();
          }
        }
      `)
    ).toBeNull();
  });

  it("returns null for a non-block consequent", () => {
    expect(
      parseFunctionBody(`
        function f() {
          if (ready) return init(), start();
        }
      `)
    ).toBeNull();
  });

  it("returns null for an empty consequent block", () => {
    expect(
      parseFunctionBody(`
        function f() {
          if (ready) {
          }
        }
      `)
    ).toBeNull();
  });

  it("returns null for an empty function body", () => {
    expect(
      parseFunctionBody(`
        function f() {}
      `)
    ).toBeNull();
  });

  it("treats an empty statement plus a real statement as a multi-statement consequent", () => {
    const wrapped = parseFunctionBody(`
      function f() {
        if (ready) {
          ;
          start();
        }
      }
    `);

    expect(wrapped?.type).toBe("IfStatement");
  });

  it("returns null when the outer if only wraps an inner multi-statement if", () => {
    expect(
      parseFunctionBody(`
        function f() {
          if (outer) {
            if (inner) {
              init();
              start();
            }
          }
        }
      `)
    ).toBeNull();
  });

  it("returns null when the last statement is a try block containing a wrapped if", () => {
    expect(
      parseFunctionBody(`
        function f() {
          try {
            if (ready) {
              init();
              start();
            }
          } catch {
            recover();
          }
        }
      `)
    ).toBeNull();
  });

  it("returns null when the last statement is a for loop containing a wrapped if", () => {
    expect(
      parseFunctionBody(`
        function f(items: string[]) {
          for (const item of items) {
            if (item) {
              process(item);
              archive(item);
            }
          }
        }
      `)
    ).toBeNull();
  });
});

function getIfTestFromFunction(code: string) {
  const source = parseSource(code);
  const program = parser.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module"
  });
  const fn = program.body[0];

  if (fn === undefined || fn.type !== "FunctionDeclaration" || fn.body.type !== "BlockStatement") {
    throw new Error("expected function");
  }

  const ifStatement = fn.body.body[0];

  if (ifStatement === undefined || ifStatement.type !== "IfStatement") {
    throw new Error("expected if");
  }

  return { source, test: ifStatement.test };
}

describe("negateTestExpression", () => {
  it("flips equality comparisons", () => {
    const { source, test } = getIfTestFromFunction("function f() { if (a === b) {} }");

    expect(negateTestExpression(source as never, test)).toBe("a !== b");
  });

  it("unwraps a leading negation", () => {
    const { source, test } = getIfTestFromFunction("function f() { if (!ready) {} }");

    expect(negateTestExpression(source as never, test)).toBe("ready");
  });

  it("applies De Morgan to logical or", () => {
    const { source, test } = getIfTestFromFunction("function f() { if (a || b) {} }");

    expect(negateTestExpression(source as never, test)).toBe("!a && !b");
  });

  it("negates identifiers with a bang", () => {
    const { source, test } = getIfTestFromFunction("function f() { if (ready) {} }");

    expect(negateTestExpression(source as never, test)).toBe("!ready");
  });

  it("wraps unknown expressions", () => {
    const { source, test } = getIfTestFromFunction("function f() { if (getReady()) {} }");

    expect(negateTestExpression(source as never, test)).toBe("!(getReady())");
  });

  it("wraps instanceof checks", () => {
    const { source, test } = getIfTestFromFunction(
      "function f(v: unknown) { if (v instanceof Error) {} }"
    );

    expect(negateTestExpression(source as never, test)).toBe("!(v instanceof Error)");
  });

  it("wraps in-operator checks", () => {
    const { source, test } = getIfTestFromFunction(
      'function f(v: object) { if ("code" in v) {} }'
    );

    expect(negateTestExpression(source as never, test)).toBe('!("code" in v)');
  });

  it("negates member expressions without extra parens", () => {
    const { source, test } = getIfTestFromFunction("function f() { if (this.ready) {} }");

    expect(negateTestExpression(source as never, test)).toBe("!this.ready");
  });
});

describe("buildGuardClauseReplacement", () => {
  it("builds a guard clause and hoisted body", () => {
    const program = parser.parse(
      `function f() {
        if (ready) {
          init();
          start();
        }
      }`,
      { ecmaVersion: "latest", sourceType: "module" }
    );
    const fn = program.body[0];

    if (fn === undefined || fn.type !== "FunctionDeclaration" || fn.body.type !== "BlockStatement") {
      throw new Error("expected function");
    }

    const ifStatement = fn.body.body[0];

    if (ifStatement === undefined || ifStatement.type !== "IfStatement") {
      throw new Error("expected if");
    }

    const source = parseSource(
      `function f() {
        if (ready) {
          init();
          start();
        }
      }`
    );

    expect(buildGuardClauseReplacement(source as never, ifStatement)).toBe(
      "if (!ready) {\n  return;\n}\n\ninit();\nstart();"
    );
  });
});
