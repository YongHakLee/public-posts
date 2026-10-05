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

/**
 * 이 슬라이드가 지금 보이는(현재) 슬라이드인지. 발표 모드는 모든 슬라이드를 마운트해 두므로
 * 영상·오디오 같은 미디어는 이 값으로 재생/일시정지한다. 읽기·인쇄 모드는 항상 true.
 */
export function useSlideActive(): boolean {
  return useSlideSlot().active;
}

/** Step id(useId) → 등장 순서 */
export type StepOrders = Readonly<Record<string, number>>;

export const StepOrderContext = createContext<StepOrders>({});
