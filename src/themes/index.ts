import { ink } from "./ink";
import { paper } from "./paper";
import { signal } from "./signal";
import type { Theme } from "./types";

export const themes = { paper, ink, signal } satisfies Record<string, Theme>;
export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

export function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(themes, value);
}
