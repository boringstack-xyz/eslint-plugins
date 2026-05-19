import {
  RULE_NAME,
  queryKeysMustBeConstantRule
} from "../../src/rules/queryKeysMustBeConstant";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, queryKeysMustBeConstantRule, {
  valid: [
    {
      code: `
        const QUERY_KEYS = {
          all: ["todos"] as const,
          detail: (id: string) => [...QUERY_KEYS.all, id] as const
        };

        function useTodos() {
          return useQuery({ queryKey: QUERY_KEYS.all });
        }
      `
    },
    {
      code: `
        function useTodos() {
          const key = ["todos"] as const;
          return useQuery({ queryKey: key });
        }
      `
    },
    {
      code: `
        function useTodos(id: string) {
          return useQuery({ queryKey: todoKeys.detail(id) });
        }
      `
    },
    {
      code: `
        function updateTodo(id: string) {
          return useMutation({
            mutationKey: todoKeys.update,
            mutationFn: (data) => patchTodo(id, data)
          });
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        function useTodos() {
          return useQuery({ queryKey: ["todos"] });
        }
      `,
      errors: [{ messageId: "nonConstantQueryKey" }]
    },
    {
      code: `
        function useTodoDetail(id: string) {
          return useQuery({ queryKey: ["todos", id] });
        }
      `,
      errors: [{ messageId: "nonConstantQueryKey" }]
    },
    {
      code: `
        function useMutateTodo() {
          return useMutation({
            mutationKey: ["todos", "update"],
            mutationFn: (data) => patchTodo(data)
          });
        }
      `,
      errors: [{ messageId: "nonConstantQueryKey" }]
    }
  ]
});
