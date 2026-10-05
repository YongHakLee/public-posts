"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Canvas } from "@/themes/types";
import { CANVAS_SIZE } from "./canvas";
import { nextFrame, slideOverflows } from "./dom";
import { SlideSlotContext } from "./slide-context";

type PrintViewProps = {
  slides: ReactNode[];
  canvas: Canvas;
  reportSteps: (index: number, count: number) => void;
};

/**
 * 모든 슬라이드를 논리 크기 그대로(배율 1) 세로로 나열한다. 폰트·이미지가 준비되면
 * 슬라이드별 data-overflow를 기록하고 <html data-ready="true">로 PDF 스크립트에 알린다.
 */
export function PrintView({ slides, canvas, reportSteps }: PrintViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const size = CANVAS_SIZE[canvas];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (img) => img.decode().catch(() => undefined)));
      await nextFrame();
      await nextFrame();
      if (cancelled || !root.current) return;
      for (const slide of root.current.querySelectorAll<HTMLElement>("[data-slide-index]")) {
        slide.dataset.overflow = String(slideOverflows(slide));
      }
      document.documentElement.dataset.ready = "true";
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={root} data-print-root>
      {slides.map((slide, i) => (
        <div key={i} className="print-page relative overflow-hidden" style={{ width: size.width, height: size.height }}>
          <SlideSlotContext
            value={{ index: i, canvas, revealed: Number.POSITIVE_INFINITY, showAll: true, active: true, reportSteps }}
          >
            {slide}
          </SlideSlotContext>
        </div>
      ))}
    </div>
  );
}
