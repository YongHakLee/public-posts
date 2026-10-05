import type { Work, WorkKind } from "./types";

const DIR: Record<WorkKind, string> = { deck: "decks", motion: "motion" };

export function isDevBuild(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function workKey(kind: WorkKind, slug: string): string {
  return `${kind}/${slug}`;
}

export function listWorks(
  works: readonly Work[],
  opts: { kind?: WorkKind; includeDrafts: boolean },
): Work[] {
  return works
    .filter((w) => (opts.kind ? w.kind === opts.kind : true))
    .filter((w) => opts.includeDrafts || !w.draft)
    .toSorted((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function findWork(works: readonly Work[], kind: WorkKind, slug: string): Work | undefined {
  return works.find((w) => w.kind === kind && w.slug === slug);
}

/** basePath를 뺀 경로. next/link가 basePath를 붙인다. */
export function workHref(work: Pick<Work, "kind" | "slug">): string {
  return `/${DIR[work.kind]}/${work.slug}/`;
}

export function contentPath(kind: WorkKind, slug: string): string {
  return `content/${DIR[kind]}/${slug}/index.tsx`;
}
