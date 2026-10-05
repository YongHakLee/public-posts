import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { academicTokens } from "./presets";

export const journal = defineTheme({
  label: "Journal",
  description: "아이보리 바탕의 명조와 짙은 버건디. 학술지 지면 느낌",
  tags: ["논문", "학술", "따뜻함"],
  color: {
    bg: "#FBF7EE",
    surface: "#F3EDE0",
    fg: "#2A2420",
    muted: "#5E554C",
    accent: "#7A1E2C",
    accentFg: "#FFFFFF",
    border: "#E2D9C8",
  },
  tokens: { ...academicTokens, font: { sans: FONT_STACKS.serif, display: FONT_STACKS.serif } },
});
