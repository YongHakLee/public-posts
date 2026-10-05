import type { Metadata } from "next";
import type { Work } from "./types";

export function workMetadata(work: Work): Metadata {
  return {
    title: work.title,
    description: work.description,
    openGraph: { title: work.title, description: work.description, type: "article" },
  };
}
