import { baseTokens } from "./base";
import type { Theme } from "./types";

export const paper: Theme = {
  ...baseTokens,
  label: "Paper",
  color: {
    bg: "#FAFAF7",
    surface: "#FFFFFF",
    fg: "#1A1A1A",
    muted: "#5C5C5C",
    accent: "#2F5BEA",
    accentFg: "#FFFFFF",
    border: "#E2E2DC",
  },
};
