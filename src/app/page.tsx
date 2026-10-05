import Link from "next/link";
import { works } from "@content/registry";
import { ThemeScope } from "@/themes/ThemeScope";
import { isDevBuild, listWorks, workHref } from "@/works/query";
import { SITE_DESCRIPTION, SITE_TITLE } from "../../site.config";

const KIND_LABEL = { deck: "덱", motion: "모션" } as const;

export default function HomePage() {
  const items = listWorks(works, { includeDrafts: isDevBuild() });
  return (
    <ThemeScope name="paper" className="min-h-dvh bg-bg text-fg">
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{SITE_TITLE}</h1>
          <p className="text-muted">{SITE_DESCRIPTION}</p>
        </header>
        {items.length === 0 ? (
          <p className="text-muted">아직 공개된 작업물이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {items.map((work) => (
              <li key={`${work.kind}/${work.slug}`}>
                <Link href={workHref(work)} className="flex flex-col gap-1 py-5 hover:opacity-80">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span>{KIND_LABEL[work.kind]}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={work.date}>{work.date}</time>
                    {work.draft && <span className="rounded bg-accent px-1.5 text-xs text-accent-fg">draft</span>}
                  </span>
                  <span className="text-xl font-bold">{work.title}</span>
                  <span className="text-muted">{work.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </ThemeScope>
  );
}
