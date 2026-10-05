"use client";

import { MotionConfig } from "motion/react";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { works } from "@content/registry";
import { ThemeScope } from "@/themes/ThemeScope";
import { findWork, workKey } from "./query";
import type { WorkKind } from "./types";

// 작업물별 코드 분할: 각 작업물은 열릴 때만 로드된다.
const views: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  works.map((work) => [workKey(work.kind, work.slug), lazy(work.load)]),
);

export function WorkView({ kind, slug }: { kind: WorkKind; slug: string }) {
  const work = findWork(works, kind, slug);
  const View = views[workKey(kind, slug)];
  if (!work || !View) return null;
  return (
    <MotionConfig reducedMotion="user">
      <ThemeScope name={work.theme} className="min-h-dvh bg-bg text-fg">
        <Suspense fallback={null}>
          <View />
        </Suspense>
      </ThemeScope>
    </MotionConfig>
  );
}
