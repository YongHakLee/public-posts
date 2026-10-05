import type { DeepPartial } from "./define";
import type { ThemeTokens } from "./types";

/** 논문·학술지: 작은 스케일, 넓은 행간·여백, 각진 모서리 */
export const academicTokens: DeepPartial<ThemeTokens> = {
  type: {
    landscape: { display: 112, h1: 72, h2: 52, body: 34, caption: 24 },
    portrait: { display: 96, h1: 64, h2: 48, body: 34, caption: 26 },
  },
  leading: { normal: 1.7 },
  space: { pad: { landscape: 144, portrait: 112 } },
  radius: 0,
};

/** 화려: 큰 제목 스케일, 빠른 모션 */
export const vividTokens: DeepPartial<ThemeTokens> = {
  type: {
    landscape: { display: 168, h1: 108, h2: 72 },
    portrait: { display: 132, h1: 92, h2: 64 },
  },
  motion: { duration: { fast: 0.14, base: 0.28, slow: 0.55 } },
};
