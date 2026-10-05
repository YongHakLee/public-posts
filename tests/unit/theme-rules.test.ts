import { describe, expect, it } from "vitest";
import { themeNames, themes } from "@/themes";
import { baseTokens } from "@/themes/base";
import { defineTheme, type ThemeSpec } from "@/themes/define";
import { FONT_STACKS, MONO_STACK } from "@/themes/fonts";
import { academicTokens, vividTokens } from "@/themes/presets";
import { THEME_TAGS, type Theme } from "@/themes/types";

const stacks: string[] = Object.values(FONT_STACKS);

const tokensOf = (theme: Theme) => ({
  font: theme.font,
  type: theme.type,
  leading: theme.leading,
  tracking: theme.tracking,
  space: theme.space,
  radius: theme.radius,
  motion: theme.motion,
});

describe.each(themeNames)("%s 테마 규칙", (name) => {
  const theme = themes[name];

  it("태그 1~3개, 모두 THEME_TAGS 소속, 중복 없음", () => {
    expect(theme.tags.length).toBeGreaterThanOrEqual(1);
    expect(theme.tags.length).toBeLessThanOrEqual(3);
    for (const tag of theme.tags) expect(THEME_TAGS).toContain(tag);
    expect(new Set(theme.tags).size).toBe(theme.tags.length);
  });

  it("설명이 비어 있지 않다", () => {
    expect(theme.description.trim()).not.toBe("");
  });

  it("글꼴은 등록된 스택만 쓴다", () => {
    expect(stacks).toContain(theme.font.sans);
    expect(stacks).toContain(theme.font.display);
    expect(theme.font.mono).toBe(MONO_STACK);
  });
});

describe("defineTheme", () => {
  const make = (tokens?: ThemeSpec["tokens"]) =>
    defineTheme({ label: "T", description: "d", tags: ["학술"], color: themes.paper.color, tokens });

  it("tokens가 없으면 기본 토큰 그대로", () => {
    expect(tokensOf(make())).toEqual(baseTokens);
  });

  it("지정한 하위 키만 바뀐다", () => {
    const theme = make({ type: { landscape: { h1: 70 } }, radius: 0 });
    expect(theme.type.landscape.h1).toBe(70);
    expect(theme.type.landscape.body).toBe(baseTokens.type.landscape.body);
    expect(theme.type.portrait).toEqual(baseTokens.type.portrait);
    expect(theme.radius).toBe(0);
    expect(theme.motion).toEqual(baseTokens.motion);
  });

  it("배열은 통째로 바뀐다", () => {
    const gap = [4, 8, 12, 20, 32, 48] as const;
    const theme = make({ space: { gap }, motion: { easing: { standard: [0, 0, 1, 1] } } });
    expect(theme.space.gap).toEqual(gap);
    expect(theme.space.pad).toEqual(baseTokens.space.pad);
    expect(theme.motion.easing.standard).toEqual([0, 0, 1, 1]);
    expect(theme.motion.easing.emphasized).toEqual(baseTokens.motion.easing.emphasized);
  });

  it("기본 토큰을 바꾸지 않는다", () => {
    const before = structuredClone(baseTokens);
    make({ type: { landscape: { h1: 1 } }, space: { pad: { portrait: 1 } }, radius: 0 });
    expect(baseTokens).toEqual(before);
  });

  it("이름·설명·태그·색은 spec 그대로", () => {
    const theme = make();
    expect(theme.label).toBe("T");
    expect(theme.description).toBe("d");
    expect(theme.tags).toEqual(["학술"]);
    expect(theme.color).toEqual(themes.paper.color);
  });
});

describe("기존 테마 유지", () => {
  it.each(["paper", "ink", "signal"] as const)("%s는 기본 토큰을 그대로 쓴다", (name) => {
    expect(tokensOf(themes[name])).toEqual(baseTokens);
  });

  it("색 값이 그대로다", () => {
    expect(themes.paper.color).toEqual({
      bg: "#FAFAF7", surface: "#FFFFFF", fg: "#1A1A1A", muted: "#5C5C5C", accent: "#2F5BEA", accentFg: "#FFFFFF", border: "#E2E2DC",
    });
    expect(themes.ink.color).toEqual({
      bg: "#0F1115", surface: "#1A1D24", fg: "#F2F2F0", muted: "#A3A7B0", accent: "#7AA2FF", accentFg: "#0F1115", border: "#2A2E37",
    });
    expect(themes.signal.color).toEqual({
      bg: "#B8321C", surface: "#A02B17", fg: "#FFFFFF", muted: "#FFE3DC", accent: "#1A1A1A", accentFg: "#FFFFFF", border: "#D9563F",
    });
  });
});

describe("태그 분포", () => {
  it.each([...THEME_TAGS])("'%s' 태그는 2개 이상의 테마가 쓴다", (tag) => {
    const users = themeNames.filter((name) => themes[name].tags.includes(tag));
    expect(users.length).toBeGreaterThanOrEqual(2);
  });
});

describe("스타일 프리셋", () => {
  it.each(["thesis", "journal"] as const)("%s는 논문 스케일·명조", (name) => {
    const theme = themes[name];
    expect(theme.type).toEqual(academicTokens.type);
    expect(theme.leading.normal).toBe(1.7);
    expect(theme.space.pad).toEqual({ landscape: 144, portrait: 112 });
    expect(theme.radius).toBe(0);
    expect(theme.font.sans).toBe(FONT_STACKS.serif);
    expect(theme.font.display).toBe(FONT_STACKS.serif);
  });

  it.each(["neon", "pop"] as const)("%s는 화려 스케일·모션·디스플레이 글꼴", (name) => {
    const theme = themes[name];
    expect(theme.type.landscape).toMatchObject(vividTokens.type!.landscape!);
    expect(theme.type.portrait).toMatchObject(vividTokens.type!.portrait!);
    expect(theme.motion.duration).toEqual({ fast: 0.14, base: 0.28, slow: 0.55 });
    expect(theme.font.display).toBe(FONT_STACKS.display);
  });

  it("terracotta는 명조 제목", () => {
    expect(themes.terracotta.font.display).toBe(FONT_STACKS.serif);
    expect(themes.terracotta.font.sans).toBe(FONT_STACKS.sans);
  });
});
