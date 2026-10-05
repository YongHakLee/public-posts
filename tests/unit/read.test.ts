import { describe, expect, it } from "vitest";
import { pickCurrent } from "@/engine/read";

describe("pickCurrent", () => {
  it("가장 많이 보이는 카드를 고른다", () => {
    expect(pickCurrent(new Map([[1, 0.4], [2, 1], [3, 0.6]]))).toBe(2);
  });
  it("동률이면 앞 카드", () => {
    expect(pickCurrent(new Map([[3, 0.8], [2, 0.8]]))).toBe(2);
  });
  it("모두 기준 미만이면 null (현재 값 유지)", () => {
    expect(pickCurrent(new Map([[0, 0.1], [1, 0.2]]))).toBeNull();
  });
  it("비어 있으면 null", () => {
    expect(pickCurrent(new Map())).toBeNull();
  });
  describe("스크롤 끝(atEnd)", () => {
    it("끝에 닿으면 기준을 넘는 마지막 카드가 이긴다", () => {
      expect(pickCurrent(new Map([[2, 1], [3, 1]]), 0.3, true)).toBe(3);
    });
    it("끝이 아니면 동률은 여전히 앞 카드", () => {
      expect(pickCurrent(new Map([[2, 1], [3, 1]]), 0.3, false)).toBe(2);
    });
    it("끝에서도 기준 미만인 카드는 고르지 않는다", () => {
      expect(pickCurrent(new Map([[2, 1], [3, 0.1]]), 0.3, true)).toBe(2);
    });
    it("끝에서 기준을 넘는 카드가 없으면 null", () => {
      expect(pickCurrent(new Map([[2, 0.1], [3, 0.2]]), 0.3, true)).toBeNull();
    });
  });
});
