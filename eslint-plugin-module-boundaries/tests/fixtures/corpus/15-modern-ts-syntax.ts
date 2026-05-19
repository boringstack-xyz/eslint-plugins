export const settings = {
  mode: "strict"
} as const satisfies Record<string, string>;

export type Settings = typeof settings;

