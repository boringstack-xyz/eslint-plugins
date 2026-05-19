import { t } from "elysia";

export const UserSchema = t.Object({
  id: t.String(),
  email: t.String()
});

export interface User {
  id: string;
  email: string;
}
