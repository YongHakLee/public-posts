import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { vividTokens } from "./presets";

export const pop = defineTheme({
  label: "Pop",
  description: "쨍한 노랑 바탕에 검정 글자, 큰 둥근 모서리",
  tags: ["화려", "색채"],
  color: {
    bg: "#FFD60A",
    surface: "#FFE55C",
    fg: "#111111",
    muted: "#3D3500",
    accent: "#111111",
    accentFg: "#FFD60A",
    border: "#E6BE00",
  },
  tokens: { ...vividTokens, radius: 40, font: { display: FONT_STACKS.display } },
});
