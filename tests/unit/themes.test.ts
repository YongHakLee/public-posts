import { describe, expect, it } from "vitest";
import { isThemeName, themeNames, themes } from "@/themes";
import { CONTRAST_PAIRS, MIN_CONTRAST, contrastRatio, parseHex } from "@/themes/contrast";
import { themeToCssVars } from "@/themes/css-vars";
import { CANVASES, COLOR_TOKENS, TYPE_STEPS } from "@/themes/types";

describe("contrastRatio", () => {
  it("검정/흰색은 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });
  it("같은 색은 1:1", () => {
    expect(contrastRatio("#3366CC", "#3366CC")).toBeCloseTo(1, 5);
  });
  it("인자 순서와 무관하다", () => {
    expect(contrastRatio("#FFFFFF", "#777777")).toBeCloseTo(contrastRatio("#777777", "#FFFFFF"), 10);
  });
  it("#777777 on 흰색 ≈ 4.48", () => {
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
  it("#rrggbb가 아니면 예외", () => {
    expect(() => parseHex("#fff")).toThrow();
    expect(() => parseHex("red")).toThrow();
  });
});

describe("themes", () => {
  it("이름 가드", () => {
    expect(isThemeName("paper")).toBe(true);
    expect(isThemeName("nope")).toBe(false);
    expect(themeNames).toEqual([
      "paper", "ink", "signal", "thesis", "journal", "lecture", "breeze", "mint", "slate", "boardroom", "neon", "pop", "terracotta",
    ]);
  });

  describe.each(themeNames)("%s", (name) => {
    const theme = themes[name];

    it.each(CONTRAST_PAIRS)("%s / %s 대비가 기준 이상", (fg, bg) => {
      expect(contrastRatio(theme.color[fg], theme.color[bg])).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    it("모든 색이 #rrggbb 형식", () => {
      for (const token of COLOR_TOKENS) expect(theme.color[token]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("두 캔버스 모두 타입 스케일이 양수이고 큰 것부터 작은 순서", () => {
      for (const canvas of CANVASES) {
        const sizes = TYPE_STEPS.map((step) => theme.type[canvas][step]);
        for (const size of sizes) expect(size).toBeGreaterThan(0);
        expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
      }
    });

    it("gap 스케일은 6단계 오름차순", () => {
      expect(theme.space.gap).toHaveLength(6);
      expect([...theme.space.gap].sort((a, b) => a - b)).toEqual([...theme.space.gap]);
    });
  });
});

describe("themeToCssVars", () => {
  const vars = themeToCssVars(themes.paper);

  it("캔버스별 타입 크기를 px로 낸다", () => {
    expect(vars["--t-h1-l"]).toBe("96px");
    expect(vars["--t-h1-p"]).toBe("84px");
    expect(vars["--t-pad-l"]).toBe("120px");
    expect(vars["--t-pad-p"]).toBe("96px");
  });

  it("색·간격·라운드를 낸다", () => {
    expect(vars["--t-accent-fg"]).toBe(themes.paper.color.accentFg);
    expect(vars["--t-gap-1"]).toBe("8px");
    expect(vars["--t-gap-6"]).toBe("96px");
    expect(vars["--t-radius"]).toBe("24px");
  });

  it("빈 값이 없다", () => {
    for (const value of Object.values(vars)) expect(value).not.toMatch(/undefined|NaN/);
  });
});
