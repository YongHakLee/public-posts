import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";

export const terracotta = defineTheme({
  label: "Terracotta",
  description: "베이지 바탕에 테라코타 포인트, 명조 제목",
  tags: ["따뜻함", "차분"],
  color: {
    bg: "#F5EDE3",
    surface: "#FBF6F0",
    fg: "#3A2A20",
    muted: "#6B5547",
    accent: "#A4472A",
    accentFg: "#FFFFFF",
    border: "#E3D3C2",
  },
  tokens: { font: { display: FONT_STACKS.serif } },
});
