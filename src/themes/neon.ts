import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { vividTokens } from "./presets";

export const neon = defineTheme({
  label: "Neon",
  description: "검정에 가까운 바탕과 마젠타 포인트, 굵은 디스플레이 제목",
  tags: ["화려", "다크", "색채"],
  color: {
    bg: "#0B0B12",
    surface: "#161626",
    fg: "#F5F5FF",
    muted: "#B4B4D0",
    accent: "#FF2BD6",
    accentFg: "#0B0B12",
    border: "#2A2A44",
  },
  tokens: { ...vividTokens, font: { display: FONT_STACKS.display } },
});
