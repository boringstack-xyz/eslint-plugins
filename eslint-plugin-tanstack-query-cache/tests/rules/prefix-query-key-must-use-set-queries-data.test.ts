import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import { prefixQueryKeyMustUseSetQueriesDataRule } from "../../src/rules/prefix-query-key-must-use-set-queries-data";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    }
  }
});

ruleTester.run(
  "prefix-query-key-must-use-set-queries-data",
  prefixQueryKeyMustUseSetQueriesDataRule,
  {
    valid: [
      {
        name: "no spread suffix — setQueryData on full key is fine",
        code: `
        import { useQuery, useQueryClient } from "@tanstack/react-query";
        const KEYS = { me: ["me"] as const };
        export function useMe() {
          return useQuery({ queryKey: KEYS.me, queryFn: async () => 1 });
        }
        export function useLogin() {
          const qc = useQueryClient();
          qc.setQueryData(KEYS.me, { id: 1 });
        }
      `
      },
      {
        name: "spread suffix — setQueriesData allowed",
        code: `
        import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
        const KEYS = { list: ["notifications", "list"] as const };
        export function useList(status) {
          return useInfiniteQuery({
            queryKey: [...KEYS.list, status],
            queryFn: async () => ({}),
            initialPageParam: undefined,
            getNextPageParam: () => undefined
          });
        }
        export function useMut() {
          const qc = useQueryClient();
          qc.setQueriesData({ queryKey: KEYS.list }, () => undefined);
        }
      `
      },
      {
        name: "spread suffix — unrelated prefix",
        code: `
        import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
        const KEYS = { list: ["notifications", "list"] as const, other: ["o"] as const };
        export function useList(status) {
          return useInfiniteQuery({
            queryKey: [...KEYS.list, status],
            queryFn: async () => ({}),
            initialPageParam: undefined,
            getNextPageParam: () => undefined
          });
        }
        export function useMut() {
          const qc = useQueryClient();
          qc.setQueryData(KEYS.other, 1);
        }
      `
      }
    ],
    invalid: [
      {
        name: "setQueryData with bare prefix",
        code: `
        import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
        const KEYS = { list: ["notifications", "list"] as const };
        export function useList(status) {
          return useInfiniteQuery({
            queryKey: [...KEYS.list, status],
            queryFn: async () => ({}),
            initialPageParam: undefined,
            getNextPageParam: () => undefined
          });
        }
        export function useMut() {
          const qc = useQueryClient();
          qc.setQueryData(KEYS.list, { pages: [], pageParams: [] });
        }
      `,
        errors: [{ messageId: "useMatcherApi" }]
      },
      {
        name: "cancelQueries with bare prefix",
        code: `
        import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
        const KEYS = { list: ["notifications", "list"] as const };
        export function useList(status) {
          return useInfiniteQuery({
            queryKey: [...KEYS.list, status ?? "all"],
            queryFn: async () => ({}),
            initialPageParam: undefined,
            getNextPageParam: () => undefined
          });
        }
        export function useMut() {
          const qc = useQueryClient();
          void qc.cancelQueries({ queryKey: KEYS.list });
        }
      `,
        errors: [{ messageId: "useMatcherApi" }]
      }
    ]
  }
);
