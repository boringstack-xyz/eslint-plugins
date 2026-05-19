import bcrypt from "bcrypt";

declare const cookie: {
  auth_token: { set: (opts: object) => void };
  session: { set: (opts: object) => void };
};
declare const token: string;

export async function login(plain: string): Promise<void> {
  // bcrypt-rounds-min: 8 is below the default minimum of 10
  await bcrypt.hash(plain, 8);

  // auth-cookie-must-be-httponly: missing httpOnly
  cookie.auth_token.set({ value: token, secure: true });

  // auth-cookie-must-be-secure-in-prod: secure: false explicitly disables it
  cookie.session.set({ value: token, httpOnly: true, secure: false });
}
