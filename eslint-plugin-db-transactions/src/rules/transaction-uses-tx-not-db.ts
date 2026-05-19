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

export const RULE_NAME = "transaction-uses-tx-not-db";

export interface TransactionUsesTxNotDbOptions {
  readonly dbNames?: readonly string[];
  readonly writeMethods?: readonly string[];
  readonly transactionMethod?: string;
}

type RuleOptions = [TransactionUsesTxNotDbOptions];
type MessageIds = "outerDbInsideTx";

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
    transactionMethod: { type: "string", minLength: 1 }
  }
};

interface TxFrame {
  readonly txParam: string;
  readonly callbackBody: TSESTree.Node;
}

export const transactionUsesTxNotDbRule = createRule<
  RuleOptions,
  MessageIds
>({
  name: RULE_NAME,
  meta: {
    type: "problem",
    docs: {
      description:
        "Inside a `db.transaction(async (tx) => ...)` callback, write calls must use `tx.X` not the outer `db.X` — outer-connection writes don't roll back."
    },
    schema: [optionSchema],
    messages: {
      outerDbInsideTx:
        "Inside the transaction callback, replace `{{db}}.{{method}}(...)` with `{{txParam}}.{{method}}(...)` — writes against the outer connection don't roll back."
    }
  },
  defaultOptions: [
    {
      dbNames: [...DEFAULT_DB_NAMES],
      writeMethods: [...DEFAULT_WRITE_METHODS],
      transactionMethod: DEFAULT_TRANSACTION_METHOD
    }
  ],
  create(context, [options]) {
    const dbNames = new Set(options.dbNames ?? DEFAULT_DB_NAMES);
    const writeMethods = new Set(
      options.writeMethods ?? DEFAULT_WRITE_METHODS
    );
    const transactionMethod =
      options.transactionMethod ?? DEFAULT_TRANSACTION_METHOD;

    const txStack: TxFrame[] = [];

    function getCallbackParamName(
      cb:
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression
    ): string | null {
      const first = cb.params[0];
      if (first === undefined) {
        return null;
      }
      if (first.type === AST_NODE_TYPES.Identifier) {
        return first.name;
      }
      return null;
    }

    return {
      CallExpression(node) {
        // Open a tx frame when this call IS a transaction call.
        const tx = matchTransactionCall(node, dbNames, transactionMethod);
        if (tx !== null) {
          const param = getCallbackParamName(tx.callback);
          if (param !== null) {
            txStack.push({
              txParam: param,
              callbackBody: tx.callback.body
            });
          }
          return;
        }

        if (txStack.length === 0) {
          return;
        }

        const writeMatch = matchDbMethodCall(node, dbNames, writeMethods);
        if (writeMatch === null) {
          return;
        }

        // Confirm the call is inside the topmost tx callback's body by
        // walking parents.
        const topmost = txStack[txStack.length - 1];
        if (topmost === undefined) {
          return;
        }

        let p: TSESTree.Node | undefined = (
          node as { parent?: TSESTree.Node }
        ).parent;
        let inside = false;
        while (p !== undefined) {
          if (p === topmost.callbackBody) {
            inside = true;
            break;
          }
          p = (p as { parent?: TSESTree.Node }).parent;
        }
        if (!inside) {
          return;
        }

        context.report({
          node,
          messageId: "outerDbInsideTx",
          data: {
            db: writeMatch.dbName,
            method: writeMatch.method,
            txParam: topmost.txParam
          }
        });
      },
      "CallExpression:exit"(node) {
        const tx = matchTransactionCall(node, dbNames, transactionMethod);
        if (tx === null) {
          return;
        }
        const param = getCallbackParamName(tx.callback);
        if (param === null) {
          return;
        }
        const top = txStack[txStack.length - 1];
        if (top !== undefined && top.callbackBody === tx.callback.body) {
          txStack.pop();
        }
      }
    };
  }
});
