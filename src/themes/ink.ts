import { defineTheme } from "./define";

export const ink = defineTheme({
  label: "Ink",
  description: "어두운 배경의 고대비. 프로젝터·어두운 장소용",
  tags: ["다크", "차분", "미니멀"],
  color: {
    bg: "#0F1115",
    surface: "#1A1D24",
    fg: "#F2F2F0",
    muted: "#A3A7B0",
    accent: "#7AA2FF",
    accentFg: "#0F1115",
    border: "#2A2E37",
  },
});
