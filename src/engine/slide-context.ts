"use client";

import { createContext, useContext } from "react";
import type { Canvas } from "@/themes/types";

export type SlideSlot = {
  /** 0부터 */
  index: number;
  canvas: Canvas;
  /** 공개된 Step 수 (order ≤ revealed 인 Step이 보임) */
  revealed: number;
  /** 읽기·인쇄 모드: 모든 Step 표시 */
  showAll: boolean;
  /** 발표 모드에서 현재 슬라이드인지 (다른 모드는 항상 true) */
  active: boolean;
  reportSteps: (index: number, count: number) => void;
};

const noop = () => {};

export const DEFAULT_SLOT: SlideSlot = {
  index: 0,
  canvas: "landscape",
  revealed: Number.POSITIVE_INFINITY,
  showAll: true,
  active: true,
  reportSteps: noop,
};

export const SlideSlotContext = createContext<SlideSlot>(DEFAULT_SLOT);

export function useSlideSlot(): SlideSlot {
  return useContext(SlideSlotContext);
}

/** Step id(useId) → 등장 순서 */
export type StepOrders = Readonly<Record<string, number>>;

export const StepOrderContext = createContext<StepOrders>({});
