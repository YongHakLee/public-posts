import { baseTokens } from "./base";
import type { Theme } from "./types";

export const signal: Theme = {
  ...baseTokens,
  label: "Signal",
  color: {
    bg: "#B8321C",
    surface: "#A02B17",
    fg: "#FFFFFF",
    muted: "#FFE3DC",
    accent: "#1A1A1A",
    accentFg: "#FFFFFF",
    border: "#D9563F",
  },
};
