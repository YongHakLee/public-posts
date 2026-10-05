import { describe, expect, it } from "vitest";
import type { Work } from "@/works/types";
import { formatFailures, pdfTargets, printUrl } from "../../scripts/lib/pdf-targets";

const load = async () => ({ default: () => null });
const base = { title: "t", description: "d", date: "2026-10-05", theme: "paper", load } as const;

const works: Work[] = [
  { ...base, kind: "deck", slug: "a" },
  { ...base, kind: "deck", slug: "wip", draft: true },
  { ...base, kind: "motion", slug: "m" },
];

describe("pdfTargets", () => {
  it("공개된 덱만, out 기준 경로로", () => {
    expect(pdfTargets(works)).toEqual([{ slug: "a", pagePath: "decks/a/", outFile: "decks/a.pdf" }]);
  });
});

describe("printUrl", () => {
  const target = { slug: "a", pagePath: "decks/a/", outFile: "decks/a.pdf" };
  it("landscape는 ?print, portrait는 canvas 파라미터 추가", () => {
    expect(printUrl("http://127.0.0.1:5000/public-posts/", target, "landscape")).toBe(
      "http://127.0.0.1:5000/public-posts/decks/a/?print",
    );
    expect(printUrl("http://127.0.0.1:5000/public-posts/", target, "portrait")).toBe(
      "http://127.0.0.1:5000/public-posts/decks/a/?print&canvas=portrait",
    );
  });
});

describe("formatFailures", () => {
  it("작업물·캔버스·슬라이드 번호를 알려준다", () => {
    const text = formatFailures([{ slug: "a", canvas: "portrait", slides: [2, 5] }]);
    expect(text).toContain("a");
    expect(text).toContain("portrait");
    expect(text).toContain("2, 5");
  });
});
