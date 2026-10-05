import type { Canvas } from "@/themes/types";
import { listWorks } from "@/works/query";
import type { Work } from "@/works/types";

export type PdfTarget = { slug: string; pagePath: string; outFile: string };

export function pdfTargets(works: readonly Work[]): PdfTarget[] {
  return listWorks(works, { kind: "deck", includeDrafts: false }).map((work) => ({
    slug: work.slug,
    pagePath: `decks/${work.slug}/`,
    outFile: `decks/${work.slug}.pdf`,
  }));
}

/** siteUrl은 basePath까지 포함하고 슬래시로 끝난다 (startServer의 url). */
export function printUrl(siteUrl: string, target: PdfTarget, canvas: Canvas): string {
  return `${siteUrl}${target.pagePath}?print${canvas === "portrait" ? "&canvas=portrait" : ""}`;
}

export type OverflowFailure = { slug: string; canvas: Canvas; slides: number[] };

export function formatFailures(failures: readonly OverflowFailure[]): string {
  return failures
    .map((f) => `- ${f.slug} [${f.canvas}] 슬라이드 ${f.slides.join(", ")}: 내용이 캔버스를 넘칩니다`)
    .join("\n");
}
