/** 테마 font 토큰에 쓰는 글꼴 스택. 테마는 이 상수만 쓴다 (tests/unit/theme-rules.test.ts). */
export const FONT_STACKS = {
  sans: 'var(--font-pretendard), "Pretendard Variable", Pretendard, system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  serif: 'var(--font-hahmlet), Hahmlet, "Noto Serif KR", "AppleMyungjo", "Batang", serif',
  display: 'var(--font-black-han-sans), "Black Han Sans", var(--font-pretendard), system-ui, sans-serif',
} as const;

export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "D2Coding", monospace';
