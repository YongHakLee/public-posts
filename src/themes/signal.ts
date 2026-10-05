import { defineTheme } from "./define";

export const signal = defineTheme({
  label: "Signal",
  description: "강한 빨강 배경에 흰 글자. 표지·섹션 구분·모션용",
  tags: ["화려", "색채"],
  color: {
    bg: "#B8321C",
    surface: "#A02B17",
    fg: "#FFFFFF",
    muted: "#FFE3DC",
    accent: "#1A1A1A",
    accentFg: "#FFFFFF",
    border: "#D9563F",
  },
});
