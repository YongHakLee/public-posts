import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { works } from "@content/registry";
import { workMetadata } from "@/works/metadata";
import { NoScript } from "@/works/NoScript";
import { findWork, isDevBuild, listWorks } from "@/works/query";
import { WorkClient } from "@/works/WorkClient";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listWorks(works, { kind: "deck", includeDrafts: isDevBuild() }).map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const work = findWork(works, "deck", (await params).slug);
  return work ? workMetadata(work) : {};
}

export default async function DeckPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const work = findWork(works, "deck", slug);
  if (!work) notFound();
  return (
    <>
      <WorkClient kind="deck" slug={slug} />
      <NoScript work={work} />
    </>
  );
}
