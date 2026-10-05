import type { Variants } from "motion/react";

export type StepEffect = "fade" | "rise" | "scale";

export const STEP_VARIANTS: Record<StepEffect, Variants> = {
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  rise: { hidden: { opacity: 0, y: 40 }, shown: { opacity: 1, y: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.92 }, shown: { opacity: 1, scale: 1 } },
};

export type SlideTransition = "fade" | "slide" | "none";

export const SLIDE_SHIFT = 96;

/** offset = 슬라이드 인덱스 − 현재 인덱스 */
export function slideAnimation(transition: SlideTransition, offset: number): { opacity: number; x: number } {
  const opacity = offset === 0 ? 1 : 0;
  if (transition !== "slide" || offset === 0) return { opacity, x: 0 };
  return { opacity, x: offset < 0 ? -SLIDE_SHIFT : SLIDE_SHIFT };
}
