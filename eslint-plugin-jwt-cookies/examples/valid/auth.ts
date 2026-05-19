import bcrypt from "bcrypt";

declare const cookie: {
  auth_token: { set: (opts: object) => void };
};
declare const token: string;
declare const env: { isProduction: boolean; BCRYPT_ROUNDS: number };
declare const AUTH_COOKIE_CONFIG: object;

export async function login(plain: string): Promise<void> {
  await bcrypt.hash(plain, 12);
  await bcrypt.hash(plain, env.BCRYPT_ROUNDS);
  cookie.auth_token.set({ value: token, ...AUTH_COOKIE_CONFIG });
  cookie.auth_token.set({
    value: token,
    httpOnly: true,
    secure: env.isProduction
  });
}
