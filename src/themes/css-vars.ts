import { CANVASES, TYPE_STEPS, type Theme } from "./types";

type CssVars = Record<`--${string}`, string>;

const SUFFIX = { landscape: "l", portrait: "p" } as const;

/** 테마 토큰 → CSS 변수. 캔버스별 값은 -l/-p 접미사로 내고 globals.css가 data-canvas에 따라 고른다. */
export function themeToCssVars(theme: Theme): CssVars {
  const vars: CssVars = {
    "--t-bg": theme.color.bg,
    "--t-surface": theme.color.surface,
    "--t-fg": theme.color.fg,
    "--t-muted": theme.color.muted,
    "--t-accent": theme.color.accent,
    "--t-accent-fg": theme.color.accentFg,
    "--t-border": theme.color.border,
    "--t-font-sans": theme.font.sans,
    "--t-font-display": theme.font.display,
    "--t-font-mono": theme.font.mono,
    "--t-leading-tight": String(theme.leading.tight),
    "--t-leading-normal": String(theme.leading.normal),
    "--t-tracking-tight": theme.tracking.tight,
    "--t-radius": `${theme.radius}px`,
  };
  for (const canvas of CANVASES) {
    const suffix = SUFFIX[canvas];
    for (const step of TYPE_STEPS) vars[`--t-${step}-${suffix}`] = `${theme.type[canvas][step]}px`;
    vars[`--t-pad-${suffix}`] = `${theme.space.pad[canvas]}px`;
  }
  theme.space.gap.forEach((gap, i) => {
    vars[`--t-gap-${i + 1}`] = `${gap}px`;
  });
  return vars;
}
