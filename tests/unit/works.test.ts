import { describe, expect, it } from "vitest";
import { contentPath, findWork, listWorks, workHref, workKey } from "@/works/query";
import type { Work } from "@/works/types";
import { validateWorks } from "@/works/validate";

const load = async () => ({ default: () => null });

const make = (over: Partial<Work>): Work => ({
  kind: "deck",
  slug: "a",
  title: "제목",
  description: "설명",
  date: "2026-10-01",
  theme: "paper",
  load,
  ...over,
});

const sample: Work[] = [
  make({ slug: "old", date: "2026-01-01" }),
  make({ slug: "new", date: "2026-10-01" }),
  make({ slug: "wip", date: "2026-12-01", draft: true }),
  make({ kind: "motion", slug: "intro", date: "2026-05-05", theme: "signal" }),
];

describe("query", () => {
  it("listWorks: draft 제외, 최신순", () => {
    expect(listWorks(sample, { includeDrafts: false }).map((w) => w.slug)).toEqual(["new", "intro", "old"]);
  });
  it("listWorks: dev에서는 draft 포함", () => {
    expect(listWorks(sample, { includeDrafts: true }).map((w) => w.slug)).toEqual(["wip", "new", "intro", "old"]);
  });
  it("listWorks: 종류 필터", () => {
    expect(listWorks(sample, { kind: "motion", includeDrafts: false }).map((w) => w.slug)).toEqual(["intro"]);
  });
  it("findWork는 종류와 slug로 찾는다", () => {
    expect(findWork(sample, "motion", "intro")?.theme).toBe("signal");
    expect(findWork(sample, "deck", "intro")).toBeUndefined();
  });
  it("경로 헬퍼", () => {
    expect(workHref(make({ slug: "hello" }))).toBe("/decks/hello/");
    expect(workHref(make({ kind: "motion", slug: "m" }))).toBe("/motion/m/");
    expect(contentPath("deck", "hello")).toBe("content/decks/hello/index.tsx");
    expect(contentPath("motion", "m")).toBe("content/motion/m/index.tsx");
    expect(workKey("deck", "hello")).toBe("deck/hello");
  });
});

describe("validateWorks", () => {
  const deps = { themeNames: ["paper", "ink", "signal"], fileExists: () => true };
  const valid = [make({ slug: "hello" }), make({ kind: "motion", slug: "m" })];

  it("정상 레지스트리는 오류 없음", () => {
    expect(validateWorks(valid, deps)).toEqual([]);
  });
  it("slug 형식", () => {
    const errors = validateWorks([...valid, make({ slug: "Bad Slug" })], deps);
    expect(errors.join("\n")).toContain("Bad Slug");
  });
  it("같은 종류 안에서 slug 중복", () => {
    const errors = validateWorks([...valid, make({ slug: "hello" })], deps);
    expect(errors.join("\n")).toContain("중복");
  });
  it("날짜 형식과 실재 날짜", () => {
    expect(validateWorks([...valid, make({ slug: "x", date: "2026/10/01" })], deps)).toHaveLength(1);
    expect(validateWorks([...valid, make({ slug: "y", date: "2026-02-30" })], deps)).toHaveLength(1);
  });
  it("없는 테마", () => {
    const errors = validateWorks([...valid, make({ slug: "z", theme: "neon" as Work["theme"] })], deps);
    expect(errors.join("\n")).toContain("neon");
  });
  it("빈 제목·설명", () => {
    expect(validateWorks([...valid, make({ slug: "t", title: " " })], deps)).toHaveLength(1);
    expect(validateWorks([...valid, make({ slug: "d", description: "" })], deps)).toHaveLength(1);
  });
  it("콘텐츠 파일이 없으면 경로를 알려준다", () => {
    const errors = validateWorks(valid, { ...deps, fileExists: (p) => !p.includes("hello") });
    expect(errors).toEqual([expect.stringContaining("content/decks/hello/index.tsx")]);
  });
  it("종류별 공개 작업물이 0개면 Next export 제약을 설명한다", () => {
    const allDraft = [make({ slug: "hello", draft: true }), make({ kind: "motion", slug: "m" })];
    const errors = validateWorks(allDraft, deps);
    expect(errors).toEqual([expect.stringContaining("공개된 deck")]);
    expect(errors[0]).toContain("generateStaticParams");
  });
});
