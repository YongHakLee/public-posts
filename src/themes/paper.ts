import { defineTheme } from "./define";

export const paper = defineTheme({
  label: "Paper",
  description: "따뜻한 흰 배경에 검정 글자, 파랑 포인트 하나. 강의·문서형 기본값",
  tags: ["학술", "차분", "미니멀"],
  color: {
    bg: "#FAFAF7",
    surface: "#FFFFFF",
    fg: "#1A1A1A",
    muted: "#5C5C5C",
    accent: "#2F5BEA",
    accentFg: "#FFFFFF",
    border: "#E2E2DC",
  },
});
