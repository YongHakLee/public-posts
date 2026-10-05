/**
 * 읽기 모드에서 '현재 카드' = 가장 많이 보이는 카드 (동률이면 앞 카드). 모두 min 미만이면 null(현재 값 유지).
 * atEnd(스크롤이 끝에 닿음)이면 기준(min) 이상인 카드 중 마지막 카드가 이긴다 —
 * 창이 크면 카드가 여럿 온전히 보여 동률이 되고, 그러면 마지막 카드는 영영 현재가 될 수 없기 때문.
 */
export function pickCurrent(ratios: ReadonlyMap<number, number>, min = 0.3, atEnd = false): number | null {
  const sorted = [...ratios].sort((a, b) => a[0] - b[0]);
  if (atEnd) {
    for (let i = sorted.length - 1; i >= 0; i--) if (sorted[i][1] >= min) return sorted[i][0];
    return null;
  }
  let best: number | null = null;
  let bestRatio = 0;
  for (const [index, ratio] of sorted) {
    if (ratio > bestRatio) {
      best = index;
      bestRatio = ratio;
    }
  }
  return best !== null && bestRatio >= min ? best : null;
}
