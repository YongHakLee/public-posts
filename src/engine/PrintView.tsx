"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Canvas } from "@/themes/types";
import { CANVAS_SIZE } from "./canvas";
import { nextFrame, slideOverflows } from "./dom";
import { SlideSlotContext } from "./slide-context";

/** 화면 밖 lazy 이미지는 decode()가 끝나지 않을 수 있어 대기 시간을 제한한다. */
const IMAGE_TIMEOUT_MS = 10_000;

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
      // 스타일·레이아웃이 웹폰트를 요청한 뒤에 fonts.ready를 기다린다.
      await nextFrame();
      await document.fonts.ready;
      const images = Array.from(document.images);
      // 화면 밖 이미지도 로드되도록 lazy를 해제한다.
      for (const img of images) img.loading = "eager";
      await Promise.all(
        images.map((img) =>
          Promise.race([
            img.decode().catch(() => undefined),
            new Promise<void>((done) => setTimeout(done, IMAGE_TIMEOUT_MS)),
          ]),
        ),
      );
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
