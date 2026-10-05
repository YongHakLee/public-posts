"use client";

import { cn } from "@/lib/cn";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label="슬라이드 진행"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-1 bg-fg/10"
    >
      <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** 이 개수를 넘으면 점 대신 "n / N" */
export const MAX_DOTS = 12;

export function ReadIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-3 z-10 flex justify-center">
      <div className="flex items-center gap-1.5 rounded-full bg-fg/70 px-3 py-1.5 text-xs text-bg">
        {total <= MAX_DOTS ? (
          Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("size-1.5 rounded-full", i === current ? "bg-bg" : "bg-bg/40")} />
          ))
        ) : (
          <span>
            {current + 1} / {total}
          </span>
        )}
      </div>
    </div>
  );
}
