import { defineTheme } from "./define";

export const slate = defineTheme({
  label: "Slate",
  description: "회청색 표면과 진회색 글자. 보고서·제안서용",
  tags: ["비즈니스", "차분"],
  color: {
    bg: "#F4F6F8",
    surface: "#E7EBEF",
    fg: "#1E2933",
    muted: "#4F5D6B",
    accent: "#3B5B7A",
    accentFg: "#FFFFFF",
    border: "#CBD3DB",
  },
  tokens: { radius: 8 },
});
