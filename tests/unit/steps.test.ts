import { describe, expect, it } from "vitest";
import { parseOrder, resolveStepOrders } from "@/engine/steps";

describe("resolveStepOrders", () => {
  it("order가 없으면 문서 순서대로 1, 2, 3", () => {
    expect(resolveStepOrders([undefined, undefined, undefined])).toEqual({ orders: [1, 2, 3], count: 3 });
  });
  it("명시한 order를 따른다", () => {
    expect(resolveStepOrders([2, 1])).toEqual({ orders: [2, 1], count: 2 });
  });
  it("같은 order는 함께 등장", () => {
    expect(resolveStepOrders([1, 1, 2])).toEqual({ orders: [1, 1, 2], count: 2 });
  });
  it("빈 번호는 압축해서 헛클릭이 없다", () => {
    expect(resolveStepOrders([5, undefined, undefined])).toEqual({ orders: [3, 1, 2], count: 3 });
    expect(resolveStepOrders([10, 10])).toEqual({ orders: [1, 1], count: 1 });
  });
  it("스텝이 없으면 count 0", () => {
    expect(resolveStepOrders([])).toEqual({ orders: [], count: 0 });
  });
});

describe("parseOrder", () => {
  it("양의 정수만 인정", () => {
    expect(parseOrder("2")).toBe(2);
    expect(parseOrder(undefined)).toBeUndefined();
    expect(parseOrder("")).toBeUndefined();
    expect(parseOrder("0")).toBeUndefined();
    expect(parseOrder("1.5")).toBeUndefined();
    expect(parseOrder("abc")).toBeUndefined();
  });
});
