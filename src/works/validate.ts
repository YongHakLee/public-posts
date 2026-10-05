import { contentPath, listWorks, workKey } from "./query";
import type { Work, WorkKind } from "./types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const KINDS: WorkKind[] = ["deck", "motion"];

function isRealDate(value: string): boolean {
  const match = DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateWorks(
  works: readonly Work[],
  deps: { themeNames: readonly string[]; fileExists: (path: string) => boolean },
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const w of works) {
    const id = workKey(w.kind, w.slug);
    if (!SLUG.test(w.slug)) errors.push(`${id}: slug는 소문자·숫자·하이픈만 쓸 수 있습니다 ("${w.slug}")`);
    if (seen.has(id)) errors.push(`${id}: slug가 중복됩니다`);
    seen.add(id);
    if (!isRealDate(w.date)) errors.push(`${id}: date는 실제 날짜의 YYYY-MM-DD여야 합니다 ("${w.date}")`);
    if (!deps.themeNames.includes(w.theme)) errors.push(`${id}: 없는 테마입니다 ("${w.theme}")`);
    if (!w.title.trim()) errors.push(`${id}: title이 비어 있습니다`);
    if (!w.description.trim()) errors.push(`${id}: description이 비어 있습니다`);
    const file = contentPath(w.kind, w.slug);
    if (!deps.fileExists(file)) errors.push(`${id}: 콘텐츠 파일이 없습니다 (${file})`);
  }

  for (const kind of KINDS) {
    if (listWorks(works, { kind, includeDrafts: false }).length === 0) {
      errors.push(
        `공개된 ${kind}가 최소 1개 필요합니다. Next 정적 export는 빈 generateStaticParams()를 거부합니다. draft를 하나 해제하세요.`,
      );
    }
  }

  return errors;
}
