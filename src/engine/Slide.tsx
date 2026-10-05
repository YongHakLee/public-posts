"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { themeToCssVars } from "@/themes/css-vars";
import { themes, type ThemeName } from "@/themes";
import { ThemeContext } from "@/themes/ThemeScope";
import { StepOrderContext, useSlideSlot, type StepOrders } from "./slide-context";
import { parseOrder, resolveStepOrders } from "./steps";

export type SlideProps = {
  children: ReactNode;
  /** 이 슬라이드만 다른 테마로 (예: 섹션 구분 슬라이드를 ink로) */
  theme?: ThemeName;
  className?: string;
};

export function Slide({ children, theme, className }: SlideProps) {
  const { index, canvas, active, reportSteps } = useSlideSlot();
  const ref = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<StepOrders>({});

  // 마운트 시 1회: 문서 순서대로 Step을 모아 등장 순서를 정하고 덱에 개수를 알린다.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const resolved = resolveStepOrders(steps.map((el) => parseOrder(el.dataset.order)));
    setOrders(Object.fromEntries(steps.map((el, i) => [el.dataset.step ?? "", resolved.orders[i] ?? 0])));
    reportSteps(index, resolved.count);
  }, [index, reportSteps]);

  const content = (
    <div
      ref={ref}
      data-slide-index={index + 1}
      data-active={active}
      data-canvas={canvas}
      data-theme={theme}
      style={theme ? (themeToCssVars(themes[theme]) as CSSProperties) : undefined}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <StepOrderContext value={orders}>{children}</StepOrderContext>
    </div>
  );

  return theme ? <ThemeContext value={themes[theme]}>{content}</ThemeContext> : content;
}
