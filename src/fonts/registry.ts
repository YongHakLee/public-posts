/**
 * next/font로 등록한 글꼴 목록 (React·next/font 없이 import 가능한 순수 모듈).
 * src/fonts/index.ts, src/fonts/fonts.json, src/themes/fonts.ts와 일치해야 한다 — tests/unit/fonts.test.ts가 검사.
 */
export const FONT_REGISTRY = [
  { family: "Pretendard", cssVariable: "--font-pretendard" },
  { family: "Hahmlet", cssVariable: "--font-hahmlet" },
  { family: "Black Han Sans", cssVariable: "--font-black-han-sans" },
] as const;

/** 글꼴 스택의 대표 이름. 등록된 변수로 시작하면 그 글꼴 이름, 아니면 첫 항목. */
export function familyForStack(stack: string): string {
  const variable = /^var\((--font-[a-z0-9-]+)\)/.exec(stack)?.[1];
  const registered = FONT_REGISTRY.find((font) => font.cssVariable === variable);
  if (registered) return registered.family;
  return (stack.split(",")[0] ?? stack).trim().replace(/^["']|["']$/g, "");
}
