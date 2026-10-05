/**
 * Step 등장 순서를 정한다. 명시한 order가 없으면 문서 순서(1부터)를 쓰고,
 * 결과를 촘촘한 순위(1, 2, 3…)로 압축해 빈 번호 때문에 아무것도 안 나오는 클릭이 없게 한다.
 */
export function resolveStepOrders(explicit: readonly (number | undefined)[]): { orders: number[]; count: number } {
  const raw = explicit.map((order, i) => order ?? i + 1);
  const ranks = new Map([...new Set(raw)].sort((a, b) => a - b).map((value, i) => [value, i + 1]));
  const orders = raw.map((value) => ranks.get(value)!);
  return { orders, count: ranks.size };
}

export function parseOrder(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
