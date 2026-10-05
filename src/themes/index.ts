import { boardroom } from "./boardroom";
import { breeze } from "./breeze";
import { ink } from "./ink";
import { journal } from "./journal";
import { lecture } from "./lecture";
import { mint } from "./mint";
import { neon } from "./neon";
import { paper } from "./paper";
import { pop } from "./pop";
import { signal } from "./signal";
import { slate } from "./slate";
import { terracotta } from "./terracotta";
import { thesis } from "./thesis";
import type { Theme } from "./types";

export const themes = {
  paper,
  ink,
  signal,
  thesis,
  journal,
  lecture,
  breeze,
  mint,
  slate,
  boardroom,
  neon,
  pop,
  terracotta,
} satisfies Record<string, Theme>;
export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

export function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(themes, value);
}
