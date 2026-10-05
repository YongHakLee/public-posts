/** 읽기 모드에서 '현재 카드' = 가장 많이 보이는 카드. 모두 min 미만이면 null(현재 값 유지). */
export function pickCurrent(ratios: ReadonlyMap<number, number>, min = 0.3): number | null {
  let best: number | null = null;
  let bestRatio = 0;
  for (const [index, ratio] of [...ratios].sort((a, b) => a[0] - b[0])) {
    if (ratio > bestRatio) {
      best = index;
      bestRatio = ratio;
    }
  }
  return best !== null && bestRatio >= min ? best : null;
}
