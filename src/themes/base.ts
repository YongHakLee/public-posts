import { FONT_STACKS, MONO_STACK } from "./fonts";
import type { ThemeTokens } from "./types";

/** 모든 테마의 기본 토큰. 테마는 defineTheme()으로 다른 부분만 덮어쓴다. */
export const baseTokens: ThemeTokens = {
  font: { sans: FONT_STACKS.sans, display: FONT_STACKS.sans, mono: MONO_STACK },
  type: {
    landscape: { display: 144, h1: 96, h2: 64, body: 40, caption: 28 },
    portrait: { display: 120, h1: 84, h2: 60, body: 40, caption: 30 },
  },
  leading: { tight: 1.15, normal: 1.5 },
  tracking: { tight: "-0.02em" },
  space: {
    pad: { landscape: 120, portrait: 96 },
    gap: [8, 16, 24, 40, 64, 96],
  },
  radius: 24,
  motion: {
    duration: { fast: 0.18, base: 0.35, slow: 0.7 },
    easing: { standard: [0.2, 0, 0, 1], emphasized: [0.05, 0.7, 0.1, 1] },
  },
};
