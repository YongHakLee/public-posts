import { describe, expect, it } from "vitest";
import { parseModeParam, resolveMode } from "@/engine/mode";

describe("parseModeParam", () => {
  it("present/read만 인정", () => {
    expect(parseModeParam("?mode=read")).toBe("read");
    expect(parseModeParam("?mode=present")).toBe("present");
    expect(parseModeParam("?mode=print")).toBeNull();
    expect(parseModeParam("")).toBeNull();
  });
});

describe("resolveMode", () => {
  it("가로 뷰포트는 발표 모드 + landscape", () => {
    expect(resolveMode({ search: "", portraitViewport: false, override: null })).toEqual({ mode: "present", canvas: "landscape" });
  });
  it("세로 뷰포트는 읽기 모드 + portrait", () => {
    expect(resolveMode({ search: "", portraitViewport: true, override: null })).toEqual({ mode: "read", canvas: "portrait" });
  });
  it("수동 지정이 자동보다 우선", () => {
    expect(resolveMode({ search: "", portraitViewport: true, override: "present" })).toEqual({ mode: "present", canvas: "landscape" });
    expect(resolveMode({ search: "", portraitViewport: false, override: "read" })).toEqual({ mode: "read", canvas: "landscape" });
  });
  it("?print가 모든 것보다 우선, canvas 파라미터로 portrait 검사", () => {
    expect(resolveMode({ search: "?print", portraitViewport: true, override: "read" })).toEqual({ mode: "print", canvas: "landscape" });
    expect(resolveMode({ search: "?print&canvas=portrait", portraitViewport: false, override: null })).toEqual({ mode: "print", canvas: "portrait" });
  });
});
