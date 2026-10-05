import { defineTheme } from "./define";

export const boardroom = defineTheme({
  label: "Boardroom",
  description: "짙은 남색 바탕에 금색 포인트. 임원 보고용",
  tags: ["비즈니스", "다크"],
  color: {
    bg: "#0F1B2D",
    surface: "#172741",
    fg: "#F1F4F8",
    muted: "#A9B6C8",
    accent: "#D4AF37",
    accentFg: "#0F1B2D",
    border: "#26385A",
  },
  tokens: { radius: 8 },
});
