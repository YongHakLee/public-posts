import type { ColorToken } from "./types";

export const MIN_CONTRAST = 4.5;

/** 테스트로 강제하고 갤러리에서 표시하는 글자/배경 조합 */
export const CONTRAST_PAIRS: readonly (readonly [ColorToken, ColorToken])[] = [
  ["fg", "bg"],
  ["muted", "bg"],
  ["fg", "surface"],
  ["accentFg", "accent"],
];

export function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`#rrggbb 형식이 아닙니다: ${hex}`);
  const n = Number.parseInt(match[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
