import {
  RULE_NAME,
  mutatingServiceMustAuditRule
} from "../../src/rules/mutating-service-must-audit";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, mutatingServiceMustAuditRule, {
  valid: [
    {
      // Audit on success path.
      filename: "src/users/users.service.ts",
      code: `
        export async function createUser(input) {
          const user = await repo.insert(input);
          await auditLogService.record({ action: "user.created" });
          return user;
        }
      `
    },
    {
      // Audit nested in a try/catch.
      filename: "src/users/users.service.ts",
      code: `
        export async function deleteUser(id) {
          try {
            await repo.delete(id);
            audit.record({ action: "user.deleted" });
          } catch (e) {
            throw e;
          }
        }
      `
    },
    {
      // Method form on a class.
      filename: "src/users/users.service.ts",
      code: `
        class UserService {
          async updateUser(id, patch) {
            await this.repo.update(id, patch);
            await this.audit.record({ action: "user.updated" });
          }
        }
      `
    },
    {
      // Not in a service file — rule no-ops.
      filename: "src/users/users.controller.ts",
      code: `
        export async function createUser() {
          return { id: 1 };
        }
      `
    },
    {
      // Not a mutating prefix.
      filename: "src/users/users.service.ts",
      code: `
        export async function loadUser(id) {
          return repo.find(id);
        }
      `
    },
    {
      // Module-private helper reached only through the audited export.
      filename: "src/catalog/catalog.service.ts",
      code: `
        async function insertDetail(tx, detail) {
          await tx.insert(details).values(detail);
        }
        const insertScheme = async (tx, scheme) => {
          await tx.insert(schemes).values(scheme);
        };
        export async function createComponent(input) {
          await db.transaction(async (tx) => {
            await insertDetail(tx, input.detail);
            await insertScheme(tx, input.scheme);
          });
          await auditLogService.record({ action: "component.created" });
        }
      `
    },
    {
      // Private and protected class methods are body, not surface.
      filename: "src/users/users.service.ts",
      code: `
        class UserService {
          private async insertProfile(user) {
            await this.repo.insert(user);
          }
          protected async updateIndex(user) {
            await this.search.upsert(user);
          }
          async #deleteShadow(user) {
            await this.repo.delete(user);
          }
          async createUser(input) {
            await this.insertProfile(input);
            await this.updateIndex(input);
            await this.#deleteShadow(input);
            await this.audit.record({ action: "user.created" });
          }
        }
      `
    },
    {
      // Exempted by allowFunctions.
      filename: "src/users/users.service.ts",
      options: [{ allowFunctions: ["createInternal"] }],
      code: `
        export async function createInternal() {
          return repo.insert({});
        }
      `
    }
  ],
  invalid: [
    {
      filename: "src/users/users.service.ts",
      code: `
        export async function createUser(input) {
          return repo.insert(input);
        }
      `,
      errors: [{ messageId: "mutationWithoutAudit" }]
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        export async function deleteUser(id) {
          return repo.delete(id);
        }
      `,
      errors: [{ messageId: "mutationWithoutAudit" }]
    },
    {
      filename: "src/users/users.service.ts",
      code: `
        class UserService {
          async revokeUser(id) {
            return this.repo.delete(id);
          }
        }
      `,
      errors: [{ messageId: "mutationWithoutAudit" }]
    },
    {
      // Exported arrow functions are surface.
      filename: "src/users/users.service.ts",
      code: `
        export const updateUser = async (id, patch) => repo.update(id, patch);
      `,
      errors: [{ messageId: "mutationWithoutAudit" }]
    },
    {
      // Service objects expose every property, private or not.
      filename: "src/users/users.service.ts",
      code: `
        export const usersService = {
          async deleteUser(id) {
            return repo.delete(id);
          }
        };
      `,
      errors: [{ messageId: "mutationWithoutAudit" }]
    },
    {
      // includePrivate restores the old behaviour.
      filename: "src/users/users.service.ts",
      options: [{ includePrivate: true }],
      code: `
        async function insertDetail(tx, detail) {
          await tx.insert(details).values(detail);
        }
        void insertDetail;
      `,
      errors: [{ messageId: "mutationWithoutAudit" }]
    }
  ]
});
