import { defineTheme } from "./define";

export const lecture = defineTheme({
  label: "Lecture",
  description: "흰 바탕에 청록 포인트. 강의·튜토리얼용",
  tags: ["학술", "산뜻"],
  color: {
    bg: "#FFFFFF",
    surface: "#F2F7F7",
    fg: "#16232A",
    muted: "#4E5D63",
    accent: "#0F766E",
    accentFg: "#FFFFFF",
    border: "#D7E3E3",
  },
});
