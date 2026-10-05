import { baseTokens } from "./base";
import type { Theme } from "./types";

export const ink: Theme = {
  ...baseTokens,
  label: "Ink",
  color: {
    bg: "#0F1115",
    surface: "#1A1D24",
    fg: "#F2F2F0",
    muted: "#A3A7B0",
    accent: "#7AA2FF",
    accentFg: "#0F1115",
    border: "#2A2E37",
  },
};
