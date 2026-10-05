"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { Theme } from "@/themes/types";

type Tokens = Theme["motion"];

export function MotionTokenDemo({ tokens }: { tokens: Tokens }) {
  const [run, setRun] = useState(0);
  const durations = Object.keys(tokens.duration) as (keyof Tokens["duration"])[];
  const easings = Object.keys(tokens.easing) as (keyof Tokens["easing"])[];

  return (
    <div className="flex flex-col gap-2">
      {durations.flatMap((d) =>
        easings.map((e) => (
          <div key={`${d}-${e}-${run}`} className="flex items-center gap-3 text-xs">
            <span className="w-40 shrink-0 font-mono">
              {d} {tokens.duration[d]}s · {e}
            </span>
            <div className="relative h-3 flex-1 rounded-full bg-surface">
              <motion.div
                className="absolute top-0 size-3 rounded-full bg-accent"
                initial={{ left: "0%" }}
                animate={{ left: "92%" }}
                transition={{ duration: tokens.duration[d], ease: tokens.easing[e] }}
              />
            </div>
          </div>
        )),
      )}
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="self-start rounded-md border border-border px-3 py-1 text-xs"
      >
        다시 재생
      </button>
    </div>
  );
}
