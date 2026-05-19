import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

import { createRule } from "../utils/createRule";
import {
  DEFAULT_DB_NAMES,
  DEFAULT_TRANSACTION_METHOD,
  DEFAULT_WRITE_METHODS,
  matchDbMethodCall,
  matchTransactionCall
} from "../utils/db";

export const RULE_NAME = "multi-write-must-be-transactional";

export interface MultiWriteMustBeTransactionalOptions {
  readonly dbNames?: readonly string[];
  readonly writeMethods?: readonly string[];
  readonly transactionMethod?: string;
  readonly thresholdWrites?: number;
}

type RuleOptions = [MultiWriteMustBeTransactionalOptions];
type MessageIds = "multiWriteOutsideTx";

const optionSchema: JSONSchema4 = {
  type: "object",
  additionalProperties: false,
  properties: {
    dbNames: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    writeMethods: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      minItems: 1
    },
    transactionMethod: { type: "string", minLength: 1 },
    thresholdWrites: { type: "number", minimum: 2 }
  }
};

type FunctionLike =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

interface FrameStats {
  readonly node: FunctionLike;
  outsideTxWrites: TSESTree.CallExpression[];
}

function getFunctionName(node: FunctionLike): string {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id !== null) {
    return node.id.name;
  }
  // For function expressions and arrows, look for assignment context.
  const parent = (node as { parent?: TSESTree.Node }).parent;
  if (parent === undefined) {
    return "<anonymous>";
  }
  if (
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.id.name;
  }
  if (
    parent.type === AST_NODE_TYPES.MethodDefinition &&
    parent.key.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.key.name;
  }
  if (
    parent.type === AST_NODE_TYPES.Property &&
    parent.key.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.key.name;
  }
  return "<anonymous>";
}

export const multiWriteMustBeTransactionalRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Functions performing two or more DB writes must group them inside a single `db.transaction(...)` callback so a partial failure rolls back."
    },
    schema: [optionSchema],
    messages: {
      multiWriteOutsideTx:
        "Function '{{name}}' performs {{count}} writes outside `{{db}}.{{transactionMethod}}(...)` — wrap them so a partial failure rolls back."
    }
  },
  defaultOptions: [
    {
      dbNames: [...DEFAULT_DB_NAMES],
      writeMethods: [...DEFAULT_WRITE_METHODS],
      transactionMethod: DEFAULT_TRANSACTION_METHOD,
      thresholdWrites: 2
    }
  ],
  create(context, [options]) {
    const dbNames = new Set(options.dbNames ?? DEFAULT_DB_NAMES);
    const writeMethods = new Set(
      options.writeMethods ?? DEFAULT_WRITE_METHODS
    );
    const transactionMethod =
      options.transactionMethod ?? DEFAULT_TRANSACTION_METHOD;
    const thresholdWrites = options.thresholdWrites ?? 2;

    const stack: FrameStats[] = [];

    function pushFrame(node: FunctionLike): void {
      stack.push({ node, outsideTxWrites: [] });
    }

    function popAndReport(): void {
      const frame = stack.pop();
      if (frame === undefined) {
        return;
      }
      if (frame.outsideTxWrites.length < thresholdWrites) {
        return;
      }
      const dbName = dbNames.values().next().value ?? "db";
      context.report({
        node: frame.node,
        messageId: "multiWriteOutsideTx",
        data: {
          name: getFunctionName(frame.node),
          count: String(frame.outsideTxWrites.length),
          db: dbName,
          transactionMethod
        }
      });
    }

    function visitFn(node: FunctionLike): void {
      pushFrame(node);
    }

    function exitFn(): void {
      popAndReport();
    }

    return {
      FunctionDeclaration: visitFn,
      "FunctionDeclaration:exit": exitFn,
      FunctionExpression: visitFn,
      "FunctionExpression:exit": exitFn,
      ArrowFunctionExpression: visitFn,
      "ArrowFunctionExpression:exit": exitFn,

      CallExpression(node) {
        // Transaction call: any write inside its callback shouldn't count
        // toward the *outer* function's write tally.
        const txMatch = matchTransactionCall(
          node,
          dbNames,
          transactionMethod
        );
        if (txMatch !== null) {
          // The inner callback's frame will be opened when we visit it.
          // We *don't* count this call site as an outside-tx write.
          return;
        }

        // DB write call?
        const writeMatch = matchDbMethodCall(node, dbNames, writeMethods);
        if (writeMatch === null) {
          return;
        }

        // Find the most-recent enclosing function frame whose node is NOT
        // the inner callback of a `db.transaction(...)` call.
        for (let i = stack.length - 1; i >= 0; i--) {
          const frame = stack[i];
          if (frame === undefined) {
            continue;
          }
          const parent = (frame.node as { parent?: TSESTree.Node }).parent;
          if (parent !== undefined && parent.type === AST_NODE_TYPES.CallExpression) {
            const callerParent = parent;
            const inner = matchTransactionCall(
              callerParent,
              dbNames,
              transactionMethod
            );
            if (inner !== null && inner.callback === frame.node) {
              // This write lives inside a transaction callback — counted
              // against that frame, not the outer function. We still want
              // to *not* flag it on the outer frame, so just stop counting
              // here entirely.
              return;
            }
          }
          frame.outsideTxWrites.push(node);
          return;
        }
      }
    };
  }
});
