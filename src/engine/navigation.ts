/** slide: 0부터. step: 현재 슬라이드에서 공개된 Step 수 (0 = 아무것도 안 보임). */
export type DeckPosition = { slide: number; step: number };

export type NavAction =
  | { type: "next" }
  | { type: "prev" }
  | { type: "first" }
  | { type: "last" }
  | { type: "goto"; slide: number };

export function clampSlide(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0));
}

export function navigate(pos: DeckPosition, action: NavAction, stepCounts: readonly number[]): DeckPosition {
  const count = stepCounts.length;
  if (count === 0) return { slide: 0, step: 0 };
  const stepsOf = (i: number) => stepCounts[i] ?? 0;

  switch (action.type) {
    case "next":
      if (pos.step < stepsOf(pos.slide)) return { slide: pos.slide, step: pos.step + 1 };
      if (pos.slide < count - 1) return { slide: pos.slide + 1, step: 0 };
      return pos;
    case "prev":
      if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 };
      if (pos.slide > 0) return { slide: pos.slide - 1, step: stepsOf(pos.slide - 1) };
      return pos;
    case "first":
      return { slide: 0, step: 0 };
    case "last":
      return { slide: count - 1, step: stepsOf(count - 1) };
    case "goto": {
      const slide = clampSlide(action.slide, count);
      return slide === pos.slide ? pos : { slide, step: 0 };
    }
  }
}

/** "#7" → 6. 숫자가 아니면 0, 범위 밖이면 보정. */
export function parseHash(hash: string, count: number): number {
  const match = /^#?(\d+)$/.exec(hash);
  if (!match) return 0;
  return clampSlide(Number(match[1]) - 1, count);
}

export function formatHash(index: number): string {
  return `#${index + 1}`;
}
