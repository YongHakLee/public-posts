import type { Canvas } from "@/themes/types";

export type Size = { width: number; height: number };

export const CANVAS_SIZE: Record<Canvas, Size> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

export type StageAspect = "16:9" | "4:5" | "1:1";

export const STAGE_SIZE: Record<StageAspect, Size> = {
  "16:9": CANVAS_SIZE.landscape,
  "4:5": CANVAS_SIZE.portrait,
  "1:1": { width: 1080, height: 1080 },
};

export type Fit = "contain" | "width";

/** 논리 캔버스를 상자에 맞추는 배율. 측정 전(0)이면 0. */
export function fitScale(box: Size, canvas: Size, fit: Fit): number {
  if (box.width <= 0) return 0;
  const byWidth = box.width / canvas.width;
  if (fit === "width") return byWidth;
  if (box.height <= 0) return 0;
  return Math.min(byWidth, box.height / canvas.height);
}

export type OverflowMetrics = { scrollWidth: number; scrollHeight: number; clientWidth: number; clientHeight: number };

export function isOverflowing(m: OverflowMetrics, tolerance = 1): boolean {
  return m.scrollHeight - m.clientHeight > tolerance || m.scrollWidth - m.clientWidth > tolerance;
}

export type Rect = { top: number; left: number; bottom: number; right: number };

/** 위/왼쪽으로 넘친 경우는 scrollHeight에 잡히지 않으므로 사각형으로도 검사한다. */
export function isOutside(child: Rect, root: Rect, tolerance = 1): boolean {
  return (
    child.top < root.top - tolerance ||
    child.left < root.left - tolerance ||
    child.bottom > root.bottom + tolerance ||
    child.right > root.right + tolerance
  );
}
