"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fitScale, type Fit, type Size } from "./canvas";

type ScaledCanvasProps = { size: Size; fit: Fit; className?: string; children: ReactNode };

/**
 * 논리 크기(size)로 레이아웃한 내용을 transform: scale로 상자에 맞춘다.
 * contain: 부모를 가득 채우고 가운데 정렬(레터박스). width: 가로에 맞추고 높이는 비율대로.
 */
export function ScaledCanvas({ size, fit, className, children }: ScaledCanvasProps) {
  const outer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setBox({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = fitScale(box, size, fit);
  const left = fit === "contain" ? (box.width - size.width * scale) / 2 : 0;
  const top = fit === "contain" ? (box.height - size.height * scale) / 2 : 0;

  return (
    <div
      ref={outer}
      className={cn(fit === "contain" ? "absolute inset-0" : "relative w-full", className)}
      style={fit === "width" ? { height: size.height * scale } : undefined}
    >
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
