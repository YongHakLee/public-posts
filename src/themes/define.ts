import { baseTokens } from "./base";
import type { Theme, ThemeTokens } from "./types";

/** 객체는 하위 키까지 선택적으로, 배열·튜플은 통째로 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type ThemeSpec = Pick<Theme, "label" | "description" | "tags" | "color"> & {
  /** 기본 토큰과 다른 부분만 */
  tokens?: DeepPartial<ThemeTokens>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** base를 바꾸지 않고, override의 객체는 하위 키 단위로 병합하고 그 밖의 값(배열 포함)은 교체한다. */
export function mergeTokens<T extends object>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = merged[key];
    merged[key] = isPlainObject(value) && isPlainObject(current) ? mergeTokens(current, value) : value;
  }
  return merged as T;
}

export function defineTheme(spec: ThemeSpec): Theme {
  const { tokens, ...identity } = spec;
  return { ...mergeTokens(baseTokens, tokens), ...identity };
}
