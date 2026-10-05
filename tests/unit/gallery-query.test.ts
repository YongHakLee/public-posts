import { describe, expect, it } from "vitest";
import {
  MAX_SELECTION,
  filterThemes,
  formatGalleryQuery,
  isThemeTag,
  parseGalleryQuery,
  toggleSelection,
} from "@/gallery/query";
import { themeNames } from "@/themes";

describe("filterThemes", () => {
  it("null이면 전체, 등록 순서 유지", () => {
    expect(filterThemes(null)).toEqual(themeNames);
  });
  it("태그를 가진 테마만, 등록 순서 유지", () => {
    expect(filterThemes("논문")).toEqual(["thesis", "journal"]);
    expect(filterThemes("다크")).toEqual(["ink", "boardroom", "neon"]);
  });
});

describe("toggleSelection", () => {
  it("없으면 뒤에 추가, 있으면 제거", () => {
    expect(toggleSelection([], "paper")).toEqual(["paper"]);
    expect(toggleSelection(["paper", "ink"], "paper")).toEqual(["ink"]);
  });
  it(`최대 ${MAX_SELECTION}개, 넘으면 가장 먼저 고른 것을 뺀다`, () => {
    expect(toggleSelection(["paper", "ink", "signal"], "thesis")).toEqual(["ink", "signal", "thesis"]);
  });
  it("입력 배열을 바꾸지 않는다", () => {
    const selected = ["paper"] as const;
    toggleSelection(selected, "ink");
    expect(selected).toEqual(["paper"]);
  });
});

describe("parseGalleryQuery", () => {
  it("빈 쿼리는 기본 상태", () => {
    expect(parseGalleryQuery("")).toEqual({ tag: null, selected: [] });
  });
  it("태그와 선택을 읽는다", () => {
    expect(parseGalleryQuery("?tag=학술&sel=thesis,mint")).toEqual({ tag: "학술", selected: ["thesis", "mint"] });
  });
  it("모르는 태그·이름, 중복, 빈 항목은 버린다", () => {
    expect(parseGalleryQuery("?tag=없는태그&sel=thesis,nope,,mint,thesis")).toEqual({ tag: null, selected: ["thesis", "mint"] });
  });
  it(`선택은 앞에서부터 ${MAX_SELECTION}개까지`, () => {
    expect(parseGalleryQuery("?sel=paper,ink,signal,thesis").selected).toEqual(["paper", "ink", "signal"]);
  });
  it("퍼센트 인코딩된 값도 읽는다", () => {
    expect(parseGalleryQuery("?tag=%EB%85%BC%EB%AC%B8&sel=thesis%2Cjournal")).toEqual({ tag: "논문", selected: ["thesis", "journal"] });
  });
});

describe("formatGalleryQuery", () => {
  it("기본 상태는 빈 문자열", () => {
    expect(formatGalleryQuery({ tag: null, selected: [] })).toBe("");
  });
  it("parse와 왕복한다 (한글 태그 포함)", () => {
    const state = { tag: "따뜻함" as const, selected: ["journal" as const, "terracotta" as const] };
    const query = formatGalleryQuery(state);
    expect(query.startsWith("?")).toBe(true);
    expect(parseGalleryQuery(query)).toEqual(state);
  });
  it("선택만 있으면 sel만", () => {
    expect(parseGalleryQuery(formatGalleryQuery({ tag: null, selected: ["pop"] }))).toEqual({ tag: null, selected: ["pop"] });
  });
});

describe("isThemeTag", () => {
  it("THEME_TAGS만 인정", () => {
    expect(isThemeTag("미니멀")).toBe(true);
    expect(isThemeTag("minimal")).toBe(false);
  });
});
