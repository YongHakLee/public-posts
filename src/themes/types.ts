export const CANVASES = ["landscape", "portrait"] as const;
export type Canvas = (typeof CANVASES)[number];

export const TYPE_STEPS = ["display", "h1", "h2", "body", "caption"] as const;
export type TypeStep = (typeof TYPE_STEPS)[number];

export const COLOR_TOKENS = ["bg", "surface", "fg", "muted", "accent", "accentFg", "border"] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export type Bezier = [number, number, number, number];

/** 갤러리 필터 순서이기도 하다 */
export const THEME_TAGS = ["논문", "학술", "산뜻", "차분", "화려", "색채", "다크", "미니멀", "비즈니스", "따뜻함"] as const;
export type ThemeTag = (typeof THEME_TAGS)[number];

export type Theme = {
  label: string;
  /** 한 줄 설명. 갤러리 카드·상세에 표시 */
  description: string;
  /** 1~3개, 중복 없음 */
  tags: readonly ThemeTag[];
  color: Record<ColorToken, string>;
  font: { sans: string; display: string; mono: string };
  /** 논리 px (캔버스 좌표계) */
  type: Record<Canvas, Record<TypeStep, number>>;
  leading: { tight: number; normal: number };
  tracking: { tight: string };
  space: {
    /** 슬라이드 안쪽 여백, 논리 px */
    pad: Record<Canvas, number>;
    /** gap-s1 … gap-s6, 논리 px */
    gap: readonly [number, number, number, number, number, number];
  };
  radius: number;
  motion: {
    /** 초 단위 */
    duration: { fast: number; base: number; slow: number };
    easing: { standard: Bezier; emphasized: Bezier };
  };
};

/** 색·이름·설명·태그를 뺀 디자인 토큰 */
export type ThemeTokens = Omit<Theme, "label" | "description" | "tags" | "color">;
