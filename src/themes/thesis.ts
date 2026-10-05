import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { academicTokens } from "./presets";

export const thesis = defineTheme({
  label: "Thesis",
  description: "순백 바탕에 검정 명조, 남색 포인트. 논문·학회 발표용",
  tags: ["논문", "학술", "미니멀"],
  color: {
    bg: "#FFFFFF",
    surface: "#F5F5F2",
    fg: "#111111",
    muted: "#555555",
    accent: "#1F3A68",
    accentFg: "#FFFFFF",
    border: "#D9D9D4",
  },
  tokens: { ...academicTokens, font: { sans: FONT_STACKS.serif, display: FONT_STACKS.serif } },
});
