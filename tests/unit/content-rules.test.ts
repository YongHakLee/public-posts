import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 슬라이드 작성 규칙 가드: content/ 의 덱·모션은 뷰포트에 반응하는 스타일을 쓰지 않는다.
 * `sm:`~`2xl:` 변형과 vw/vh 계열 단위는 실제 창 크기에 반응하지만, 오버플로 검사는 정확히 1080×1350 / 1920×1080
 * 에서 돈다. 그래서 검사가 통과해도 390px 폰에서는 다른 레이아웃이 나올 수 있다. 캔버스 차이는 `portrait:`로만 쓴다.
 * 정규식은 소스 텍스트에 대한 단순 검사다 (문자열·주석 구분 없음 — 오탐이면 표현을 바꾼다).
 */
const RULES: { name: string; pattern: RegExp }[] = [
  // (max-|min-)?sm: md: lg: xl: 2xl: — 클래스 토큰 앞은 공백·따옴표·`:`(다른 변형 뒤)·줄 처음.
  { name: "뷰포트 반응형 변형 (sm: md: lg: xl: 2xl:)", pattern: /(^|[\s"'`:!])(max-|min-)?(sm|md|lg|xl|2xl):\S/ },
  // 100vh, 50dvw, 1.5svh, 10vmin ... (Tailwind 임의값 `h-[100vh]` 포함)
  { name: "뷰포트 단위 (vw vh dvh svh lvh vmin vmax)", pattern: /\d(\.\d+)?([dsl]?v[hw]|vmin|vmax)\b/ },
  // h-screen w-screen min-h-screen max-w-screen h-dvh w-svh ...
  { name: "뷰포트 유틸리티 (h-screen, w-screen, h-dvh ...)", pattern: /(^|[\s"'`:!])(min-|max-)?[hw]-(screen|[dsl]?v[hw])\b/ },
];

function findViolations(source: string): { line: number; rule: string; text: string }[] {
  const found: { line: number; rule: string; text: string }[] = [];
  source.split("\n").forEach((text, i) => {
    for (const { name, pattern } of RULES) if (pattern.test(text)) found.push({ line: i + 1, rule: name, text: text.trim() });
  });
  return found;
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("findViolations (규칙 자체 검사)", () => {
  it.each([
    'className="flex md:flex-row"',
    'className="hover:lg:p-4"',
    'className="max-md:hidden"',
    "className={`p-4 2xl:p-8`}",
    'className="h-[100vh]"',
    'style={{ width: "50vw" }}',
    'style={{ height: "100dvh" }}',
    'className="min-h-screen"',
    'className="w-screen"',
    'className="h-dvh"',
  ])("걸린다: %s", (source) => {
    expect(findViolations(source)).not.toHaveLength(0);
  });

  it.each([
    'className="flex flex-row portrait:flex-col"',
    'className="gap-s3 p-canvas text-display"',
    'className="h-full w-full"',
    'style={{ width: "100%" }}',
    'className="text-h2 sm"', // sm 이라는 단어만 있는 경우
  ])("통과한다: %s", (source) => {
    expect(findViolations(source)).toHaveLength(0);
  });
});

describe("content/ 슬라이드 규칙", () => {
  const files = [...tsxFiles("content/decks"), ...tsxFiles("content/motion")];

  it("스캔 대상이 있다", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("덱·모션 소스에 뷰포트 반응형 스타일이 없다 (캔버스 차이는 portrait: 로)", () => {
    const violations = files.flatMap((file) =>
      findViolations(readFileSync(file, "utf8")).map((v) => `${relative(".", file)}:${v.line}  [${v.rule}]  ${v.text}`),
    );
    expect(violations, `\n${violations.join("\n")}\n`).toEqual([]);
  });
});
