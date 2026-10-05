import { describe, expect, it } from "vitest";
import { SLIDE_SHIFT, STEP_VARIANTS, slideAnimation } from "@/engine/effects";

describe("slideAnimation", () => {
  it("현재 슬라이드는 보이고 제자리", () => {
    expect(slideAnimation("fade", 0)).toEqual({ opacity: 1, x: 0 });
    expect(slideAnimation("slide", 0)).toEqual({ opacity: 1, x: 0 });
  });
  it("fade/none은 이동 없이 투명", () => {
    expect(slideAnimation("fade", 2)).toEqual({ opacity: 0, x: 0 });
    expect(slideAnimation("none", -1)).toEqual({ opacity: 0, x: 0 });
  });
  it("slide는 방향에 따라 좌우로 밀린다", () => {
    expect(slideAnimation("slide", -1)).toEqual({ opacity: 0, x: -SLIDE_SHIFT });
    expect(slideAnimation("slide", 3)).toEqual({ opacity: 0, x: SLIDE_SHIFT });
  });
});

describe("STEP_VARIANTS", () => {
  it("세 효과 모두 hidden/shown을 가진다", () => {
    for (const effect of ["fade", "rise", "scale"] as const) {
      expect(STEP_VARIANTS[effect]).toHaveProperty("hidden");
      expect(STEP_VARIANTS[effect]).toHaveProperty("shown");
    }
  });
});
