import { defineTheme } from "./define";

export const breeze = defineTheme({
  label: "Breeze",
  description: "아주 옅은 하늘색과 남색 글자, 넓은 여백",
  tags: ["산뜻", "미니멀"],
  color: {
    bg: "#F2F7FC",
    surface: "#FFFFFF",
    fg: "#12263F",
    muted: "#4A5D75",
    accent: "#2563EB",
    accentFg: "#FFFFFF",
    border: "#D6E2F0",
  },
  tokens: { space: { pad: { landscape: 144, portrait: 112 } } },
});
