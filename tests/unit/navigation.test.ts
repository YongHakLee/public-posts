import { describe, expect, it } from "vitest";
import { clampSlide, formatHash, navigate, parseHash } from "@/engine/navigation";

const counts = [0, 3, 0, 1]; // 슬라이드별 스텝 수

describe("navigate", () => {
  it("next: 스텝이 남아 있으면 스텝부터", () => {
    expect(navigate({ slide: 1, step: 0 }, { type: "next" }, counts)).toEqual({ slide: 1, step: 1 });
    expect(navigate({ slide: 1, step: 3 }, { type: "next" }, counts)).toEqual({ slide: 2, step: 0 });
  });
  it("next: 마지막 슬라이드의 마지막 스텝이면 그대로", () => {
    const end = { slide: 3, step: 1 };
    expect(navigate(end, { type: "next" }, counts)).toBe(end);
  });
  it("prev: 스텝을 되돌리고, 0이면 이전 슬라이드를 모두 펼친 상태로", () => {
    expect(navigate({ slide: 1, step: 2 }, { type: "prev" }, counts)).toEqual({ slide: 1, step: 1 });
    expect(navigate({ slide: 2, step: 0 }, { type: "prev" }, counts)).toEqual({ slide: 1, step: 3 });
  });
  it("prev: 첫 슬라이드 처음이면 그대로", () => {
    const start = { slide: 0, step: 0 };
    expect(navigate(start, { type: "prev" }, counts)).toBe(start);
  });
  it("first / last", () => {
    expect(navigate({ slide: 2, step: 0 }, { type: "first" }, counts)).toEqual({ slide: 0, step: 0 });
    expect(navigate({ slide: 0, step: 0 }, { type: "last" }, counts)).toEqual({ slide: 3, step: 1 });
  });
  it("goto: 범위를 보정하고 스텝은 0", () => {
    expect(navigate({ slide: 0, step: 0 }, { type: "goto", slide: 99 }, counts)).toEqual({ slide: 3, step: 0 });
    expect(navigate({ slide: 2, step: 0 }, { type: "goto", slide: -5 }, counts)).toEqual({ slide: 0, step: 0 });
  });
  it("goto: 같은 슬라이드면 현재 스텝 유지", () => {
    const pos = { slide: 1, step: 2 };
    expect(navigate(pos, { type: "goto", slide: 1 }, counts)).toBe(pos);
  });
  it("슬라이드가 0장이면 0,0", () => {
    expect(navigate({ slide: 0, step: 0 }, { type: "next" }, [])).toEqual({ slide: 0, step: 0 });
  });
});

describe("hash", () => {
  it("1부터 세는 번호를 0부터 세는 인덱스로", () => {
    expect(parseHash("#1", 4)).toBe(0);
    expect(parseHash("#3", 4)).toBe(2);
    expect(parseHash("3", 4)).toBe(2);
  });
  it("범위 밖은 보정", () => {
    expect(parseHash("#99", 4)).toBe(3);
    expect(parseHash("#0", 4)).toBe(0);
  });
  it("숫자가 아니면 0", () => {
    expect(parseHash("", 4)).toBe(0);
    expect(parseHash("#abc", 4)).toBe(0);
    expect(parseHash("#2.5", 4)).toBe(0);
    expect(parseHash("#-2", 4)).toBe(0);
  });
  it("formatHash", () => {
    expect(formatHash(0)).toBe("#1");
    expect(formatHash(6)).toBe("#7");
  });
  it("clampSlide", () => {
    expect(clampSlide(5, 3)).toBe(2);
    expect(clampSlide(-1, 3)).toBe(0);
    expect(clampSlide(0, 0)).toBe(0);
  });
});
