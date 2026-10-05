import { describe, expect, it } from "vitest";
import { CANVAS_SIZE, STAGE_SIZE, fitScale, isOutside, isOverflowing } from "@/engine/canvas";

describe("CANVAS_SIZE", () => {
  it("landscape 1920×1080, portrait 1080×1350", () => {
    expect(CANVAS_SIZE.landscape).toEqual({ width: 1920, height: 1080 });
    expect(CANVAS_SIZE.portrait).toEqual({ width: 1080, height: 1350 });
    expect(STAGE_SIZE["1:1"]).toEqual({ width: 1080, height: 1080 });
  });
});

describe("fitScale", () => {
  const canvas = { width: 1920, height: 1080 };
  it("contain은 가로·세로 중 작은 비율", () => {
    expect(fitScale({ width: 960, height: 1000 }, canvas, "contain")).toBeCloseTo(0.5);
    expect(fitScale({ width: 3840, height: 540 }, canvas, "contain")).toBeCloseTo(0.5);
  });
  it("width는 가로 비율만", () => {
    expect(fitScale({ width: 390, height: 10 }, { width: 1080, height: 1350 }, "width")).toBeCloseTo(390 / 1080);
  });
  it("아직 측정 전(0)이면 0", () => {
    expect(fitScale({ width: 0, height: 0 }, canvas, "contain")).toBe(0);
    expect(fitScale({ width: 0, height: 500 }, canvas, "width")).toBe(0);
  });
});

describe("isOverflowing", () => {
  it("스크롤 크기가 클라이언트 크기를 넘으면 true", () => {
    expect(isOverflowing({ scrollWidth: 1920, scrollHeight: 1200, clientWidth: 1920, clientHeight: 1080 })).toBe(true);
    expect(isOverflowing({ scrollWidth: 2000, scrollHeight: 1080, clientWidth: 1920, clientHeight: 1080 })).toBe(true);
  });
  it("1px 이하 오차는 무시", () => {
    expect(isOverflowing({ scrollWidth: 1921, scrollHeight: 1081, clientWidth: 1920, clientHeight: 1080 })).toBe(false);
  });
});

describe("isOutside", () => {
  const root = { top: 0, left: 0, bottom: 1080, right: 1920 };
  it("위로 넘친 요소도 잡는다 (scrollHeight로는 안 잡히는 경우)", () => {
    expect(isOutside({ top: -40, left: 100, bottom: 200, right: 800 }, root)).toBe(true);
  });
  it("안쪽 요소는 false", () => {
    expect(isOutside({ top: 120, left: 120, bottom: 960, right: 1800 }, root)).toBe(false);
  });
});
