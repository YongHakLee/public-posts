import { isOutside, isOverflowing } from "./canvas";

export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** 링크·버튼 등을 누른 경우 슬라이드를 넘기지 않는다. 직접 막고 싶으면 data-no-nav. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("a, button, input, textarea, select, summary, [data-no-nav]") !== null;
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined);
    return;
  }
  // iPhone Safari 등 미지원 브라우저에서는 아무 일도 하지 않는다.
  void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function nextFrame(): Promise<void> {
  return new Promise((done) => requestAnimationFrame(() => done()));
}

/** 의도적으로 캔버스 밖으로 걸친 장식 요소는 data-bleed로 제외한다. */
export function slideOverflows(slide: HTMLElement): boolean {
  if (isOverflowing(slide)) return true;
  const root = slide.getBoundingClientRect();
  return Array.from(slide.querySelectorAll<HTMLElement>("*")).some((el) => {
    if (el.closest("[data-bleed]")) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && isOutside(rect, root);
  });
}
