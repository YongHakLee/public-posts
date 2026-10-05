import type { Work } from "@/works/types";

/**
 * 작업물 목록의 단일 출처. 추가 = content/<decks|motion>/<slug>/index.tsx + 항목 1개.
 * 공개 작업물은 종류별 최소 1개가 필요하다 (tests/unit/registry.test.ts가 검사).
 */
export const works: Work[] = [
  {
    kind: "deck",
    slug: "hello",
    title: "public-posts 둘러보기",
    description: "발표·읽기·PDF로 보는 샘플 덱",
    date: "2026-10-05",
    theme: "paper",
    load: () => import("./decks/hello"),
  },
  {
    kind: "motion",
    slug: "hello-motion",
    title: "움직이는 인사",
    description: "타임라인 기반 샘플 모션",
    date: "2026-10-05",
    theme: "signal",
    load: () => import("./motion/hello-motion"),
  },
];
