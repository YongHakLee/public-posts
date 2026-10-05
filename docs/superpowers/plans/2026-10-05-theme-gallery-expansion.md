# Theme Expansion & Tagged Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 테마를 3개에서 13개로 늘리고(태그 10종, 테마별 글꼴·스케일), 개발 모드 갤러리를 태그 필터 + 카드 그리드 + 최대 3개 상세 비교 화면으로 바꾼다.

**Architecture:** `Theme`에 `description`·`tags`를 추가하고 `defineTheme()`이 기본 토큰에 테마별 차이만 깊게 병합한다. 새 글꼴 2종(Hahmlet 명조, Black Han Sans 디스플레이)은 `next/font/local`에 `preload: false`로 등록하고, 테마는 `src/themes/fonts.ts`의 스택 상수만 쓴다. 갤러리는 순수 로직(`src/gallery/query.ts`)과 클라이언트 UI(`GalleryApp`)로 나누고 상태를 URL(`?tag=&sel=`)에 둔다.

**Tech Stack:** 기존과 동일 — Next.js 16.3.8, React 19.3, Tailwind v4.3, Motion 14, TypeScript 6.0.3, Vitest 5, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-10-05-theme-gallery-expansion-design.md` (선행: `docs/superpowers/specs/2026-10-05-web-presentation-platform-design.md` §5)

## Global Constraints

- 기존 테마 `paper`·`ink`·`signal`은 이름·색·토큰이 그대로다(태그·설명만 추가). 기존 덱·E2E·PDF는 변경 없이 통과해야 한다.
- 테마 13개, 이 순서로 등록: `paper, ink, signal, thesis, journal, lecture, breeze, mint, slate, boardroom, neon, pop, terracotta`.
- 태그 목록과 순서: `논문, 학술, 산뜻, 차분, 화려, 색채, 다크, 미니멀, 비즈니스, 따뜻함` (`THEME_TAGS`).
- 테마당 태그 1~3개(중복 없음), 모든 태그는 2개 이상의 테마가 쓴다.
- 모든 테마: `fg/bg`, `muted/bg`, `fg/surface`, `accentFg/accent` 대비 4.5:1 이상; 두 캔버스 타입 스케일 양수·내림차순; gap 6단계 오름차순.
- 테마의 `font.sans`·`font.display`는 `FONT_STACKS`(`src/themes/fonts.ts`)의 값만, `font.mono`는 `MONO_STACK`만 쓴다.
- 새 글꼴은 google/fonts 커밋 `9710da1eacb3be272583c3224dcb70f9da6eadbb`에서 받는다: `ofl/hahmlet/Hahmlet[wght].ttf` → `src/fonts/HahmletVariable.ttf`(3559144 bytes), `ofl/blackhansans/BlackHanSans-Regular.ttf` → `src/fonts/BlackHanSans-Regular.ttf`(998424 bytes), 각 `OFL.txt` → `src/fonts/LICENSE-Hahmlet.txt`, `src/fonts/LICENSE-BlackHanSans.txt`. 두 글꼴은 `preload: false`.
- 글꼴·도구 변경은 같은 커밋에서 `CLAUDE.md` 매니페스트를 갱신하고 `npm run doctor`를 통과시킨다.
- 갤러리는 dev 전용(`src/app/gallery/page.dev.tsx`)이며 프로덕션 빌드에 `out/gallery`가 없어야 한다.
- 갤러리 선택은 최대 3개, 넷째 선택 시 가장 먼저 선택한 것을 뺀다. URL은 `?tag=<태그>&sel=<이름>,<이름>`이며 `history.replaceState`로만 갱신한다.
- `content/` 아래 파일은 바꾸지 않는다.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 작업 브랜치: `feat/theme-gallery` (main에서 분기). 병합·push는 하지 않는다.

## Review Focus

1. **오래된 북마크·잘못 입력한 URL** — `?tag=없는태그&sel=thesis,nope,mint,thesis` 같은 값이어도 갤러리가 열리고, 모르는 값·중복은 버려지고 URL도 정리돼야 한다 → Task 4 `parseGalleryQuery` 단위 테스트 + Task 5 dev E2E.
2. **한글 태그의 URL 인코딩 왕복** — `tag=논문`이 퍼센트 인코딩된 채로 저장·복원돼도 같은 상태여야 한다 → Task 4 왕복 테스트.
3. **필터를 바꿔도 선택이 유지** — 다른 태그로 걸러 선택한 카드가 그리드에서 사라져도 상세 영역에는 남아야 한다 → Task 5 dev E2E.
4. **글꼴 스택 오타** — 등록되지 않은 `--font-*` 변수를 쓰면 조용히 시스템 글꼴로 대체된다 → Task 1 스택·레지스트리 테스트 + Task 2 테마 글꼴 규칙 테스트.
5. **다른 머신에 글꼴 파일이 없음** — 새 글꼴·라이선스 파일이 빠지면 doctor와 단위 테스트가 잡아야 한다 → Task 1 `fonts.test.ts` + doctor.

---

## File Structure

```
src/fonts/
├─ HahmletVariable.ttf, BlackHanSans-Regular.ttf          # Task 1 (Git 포함)
├─ LICENSE-Hahmlet.txt, LICENSE-BlackHanSans.txt          # Task 1
├─ fonts.json                                             # Task 1: 항목 2개 추가
├─ registry.ts                                            # Task 1: 글꼴 목록(순수) + familyForStack
└─ index.ts                                               # Task 1: next/font 등록 + fontVariables
src/themes/
├─ fonts.ts                                               # Task 1: FONT_STACKS, MONO_STACK
├─ base.ts                                                # Task 1(스택 상수 사용) → Task 2(ThemeTokens 타입)
├─ types.ts                                               # Task 2: THEME_TAGS, ThemeTag, ThemeTokens, Theme 확장
├─ define.ts                                              # Task 2: DeepPartial, mergeTokens, defineTheme
├─ paper.ts, ink.ts, signal.ts                            # Task 2: defineTheme + 태그·설명
├─ presets.ts                                             # Task 3: academicTokens, vividTokens
├─ thesis.ts … terracotta.ts (10개)                       # Task 3
└─ index.ts                                               # Task 3: 13개 등록
src/gallery/
├─ query.ts                                               # Task 4: 순수 로직
├─ GalleryApp.tsx, ThemeCard.tsx                          # Task 5
└─ ThemeColumn.tsx                                        # Task 5: 설명·태그·글꼴, 스펙시먼 글꼴
src/app/layout.tsx                                        # Task 1: 모든 글꼴 변수
src/app/gallery/page.dev.tsx                              # Task 5
playwright.dev.config.ts, tests/dev/gallery.spec.ts       # Task 5: dev 서버 대상 갤러리 E2E
tests/unit/fonts.test.ts                                  # Task 1
tests/unit/theme-rules.test.ts                            # Task 2 → Task 3 확장
tests/unit/gallery-query.test.ts                          # Task 4
CLAUDE.md                                                 # Task 1(매니페스트), Task 3(테마 레시피·목록), Task 5(명령어)
```

---

### Task 1: 글꼴 추가와 글꼴 레지스트리

**Files:**
- Create: `src/fonts/HahmletVariable.ttf`, `src/fonts/BlackHanSans-Regular.ttf`, `src/fonts/LICENSE-Hahmlet.txt`, `src/fonts/LICENSE-BlackHanSans.txt`, `src/fonts/registry.ts`, `src/themes/fonts.ts`
- Modify: `src/fonts/fonts.json`, `src/fonts/index.ts`, `src/themes/base.ts`, `src/app/layout.tsx`, `CLAUDE.md`
- Test: `tests/unit/fonts.test.ts`

**Interfaces:**
- Produces:
  - `src/fonts/registry.ts`: `FONT_REGISTRY: readonly { family: string; cssVariable: string }[]` (Pretendard `--font-pretendard`, Hahmlet `--font-hahmlet`, Black Han Sans `--font-black-han-sans`), `familyForStack(stack: string): string`.
  - `src/themes/fonts.ts`: `FONT_STACKS = { sans, serif, display } as const` (각 값은 `var(--font-…)`로 시작), `MONO_STACK: string`.
  - `src/fonts/index.ts`: `pretendard`, `hahmlet`, `blackHanSans`, `fontVariables: string` (세 `.variable` 클래스를 공백으로 이은 값).

- [ ] **Step 1: 작업 브랜치**

```bash
cd /home/dragon/github/public-posts
git switch -c feat/theme-gallery
```

- [ ] **Step 2: 실패하는 테스트 작성**

`tests/unit/fonts.test.ts`:
```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FONT_REGISTRY, familyForStack } from "@/fonts/registry";
import { FONT_STACKS, MONO_STACK } from "@/themes/fonts";

type FontJson = { family: string; version: string; file: string; license: string; licenseFile: string };
const fontsJson = JSON.parse(readFileSync("src/fonts/fonts.json", "utf8")) as FontJson[];
const indexSource = readFileSync("src/fonts/index.ts", "utf8");
const registeredVariables = FONT_REGISTRY.map((font) => font.cssVariable);

describe("글꼴 레지스트리", () => {
  it("fonts.json과 같은 글꼴 목록", () => {
    expect(FONT_REGISTRY.map((font) => font.family).toSorted()).toEqual(fontsJson.map((font) => font.family).toSorted());
  });

  it.each(fontsJson)("$family: 글꼴·라이선스 파일이 있다", (font) => {
    expect(existsSync(join("src/fonts", font.file))).toBe(true);
    expect(existsSync(join("src/fonts", font.licenseFile))).toBe(true);
  });

  it("src/fonts/index.ts가 같은 CSS 변수를 선언한다", () => {
    const declared = [...indexSource.matchAll(/variable:\s*"(--font-[a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(declared.toSorted()).toEqual(registeredVariables.toSorted());
  });

  it("Pretendard 외 글꼴은 preload하지 않는다", () => {
    expect(indexSource.match(/preload:\s*false/g)).toHaveLength(FONT_REGISTRY.length - 1);
  });
});

describe("글꼴 스택", () => {
  it.each(Object.entries(FONT_STACKS))("%s 스택은 등록된 글꼴 변수로 시작한다", (_, stack) => {
    const variable = /^var\((--font-[a-z0-9-]+)\)/.exec(stack)?.[1];
    expect(registeredVariables).toContain(variable);
  });

  it("familyForStack은 등록된 글꼴 이름을 돌려준다", () => {
    expect(familyForStack(FONT_STACKS.sans)).toBe("Pretendard");
    expect(familyForStack(FONT_STACKS.serif)).toBe("Hahmlet");
    expect(familyForStack(FONT_STACKS.display)).toBe("Black Han Sans");
  });

  it("등록되지 않은 스택은 첫 글꼴 이름", () => {
    expect(familyForStack(MONO_STACK)).toBe("ui-monospace");
    expect(familyForStack('"Some Font", serif')).toBe("Some Font");
  });
});
```

Run: `npx vitest run tests/unit/fonts.test.ts`
Expected: FAIL — `Failed to resolve import "@/fonts/registry"`.

- [ ] **Step 3: 글꼴 파일 받기**

```bash
SHA=9710da1eacb3be272583c3224dcb70f9da6eadbb
BASE=https://raw.githubusercontent.com/google/fonts/$SHA/ofl
curl -fsSL -o src/fonts/HahmletVariable.ttf "$BASE/hahmlet/Hahmlet%5Bwght%5D.ttf"
curl -fsSL -o src/fonts/LICENSE-Hahmlet.txt "$BASE/hahmlet/OFL.txt"
curl -fsSL -o src/fonts/BlackHanSans-Regular.ttf "$BASE/blackhansans/BlackHanSans-Regular.ttf"
curl -fsSL -o src/fonts/LICENSE-BlackHanSans.txt "$BASE/blackhansans/OFL.txt"
stat -c '%s %n' src/fonts/HahmletVariable.ttf src/fonts/BlackHanSans-Regular.ttf
head -1 src/fonts/LICENSE-Hahmlet.txt src/fonts/LICENSE-BlackHanSans.txt
```
Expected: `3559144 src/fonts/HahmletVariable.ttf`, `998424 src/fonts/BlackHanSans-Regular.ttf`, 라이선스 첫 줄이 각각 `Copyright 2020 The Hahmlet Project Authors …`, `Copyright 2015 The Black Han Sans Project Authors …`.

`src/fonts/fonts.json` (전체 교체):
```json
[
  {
    "family": "Pretendard",
    "version": "1.3.9",
    "file": "PretendardVariable.woff2",
    "license": "OFL-1.1",
    "licenseFile": "LICENSE-Pretendard.txt"
  },
  {
    "family": "Hahmlet",
    "version": "google-fonts@9710da1eacb3",
    "file": "HahmletVariable.ttf",
    "license": "OFL-1.1",
    "licenseFile": "LICENSE-Hahmlet.txt",
    "source": "https://github.com/google/fonts/tree/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/hahmlet"
  },
  {
    "family": "Black Han Sans",
    "version": "google-fonts@9710da1eacb3",
    "file": "BlackHanSans-Regular.ttf",
    "license": "OFL-1.1",
    "licenseFile": "LICENSE-BlackHanSans.txt",
    "source": "https://github.com/google/fonts/tree/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/blackhansans"
  }
]
```

- [ ] **Step 4: 레지스트리·스택·등록 코드**

`src/fonts/registry.ts`:
```ts
/**
 * next/font로 등록한 글꼴 목록 (React·next/font 없이 import 가능한 순수 모듈).
 * src/fonts/index.ts, src/fonts/fonts.json, src/themes/fonts.ts와 일치해야 한다 — tests/unit/fonts.test.ts가 검사.
 */
export const FONT_REGISTRY = [
  { family: "Pretendard", cssVariable: "--font-pretendard" },
  { family: "Hahmlet", cssVariable: "--font-hahmlet" },
  { family: "Black Han Sans", cssVariable: "--font-black-han-sans" },
] as const;

/** 글꼴 스택의 대표 이름. 등록된 변수로 시작하면 그 글꼴 이름, 아니면 첫 항목. */
export function familyForStack(stack: string): string {
  const variable = /^var\((--font-[a-z0-9-]+)\)/.exec(stack)?.[1];
  const registered = FONT_REGISTRY.find((font) => font.cssVariable === variable);
  if (registered) return registered.family;
  return (stack.split(",")[0] ?? stack).trim().replace(/^["']|["']$/g, "");
}
```

`src/themes/fonts.ts`:
```ts
/** 테마 font 토큰에 쓰는 글꼴 스택. 테마는 이 상수만 쓴다 (tests/unit/theme-rules.test.ts). */
export const FONT_STACKS = {
  sans: 'var(--font-pretendard), "Pretendard Variable", Pretendard, system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  serif: 'var(--font-hahmlet), Hahmlet, "Noto Serif KR", "AppleMyungjo", "Batang", serif',
  display: 'var(--font-black-han-sans), "Black Han Sans", var(--font-pretendard), system-ui, sans-serif',
} as const;

export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "D2Coding", monospace';
```

`src/fonts/index.ts` (전체 교체):
```ts
import localFont from "next/font/local";

export const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

// 아래 글꼴은 preload하지 않는다. 그 글꼴로 렌더되는 텍스트가 있을 때만 브라우저가 내려받는다.
export const hahmlet = localFont({
  src: "./HahmletVariable.ttf",
  variable: "--font-hahmlet",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

export const blackHanSans = localFont({
  src: "./BlackHanSans-Regular.ttf",
  variable: "--font-black-han-sans",
  weight: "400",
  display: "swap",
  preload: false,
});

/** <html>에 붙여 모든 글꼴 CSS 변수를 정의하는 클래스 */
export const fontVariables = [pretendard, hahmlet, blackHanSans].map((font) => font.variable).join(" ");
```

`src/themes/base.ts`: 파일 위쪽의 `SANS`·`MONO` 상수 정의 두 개를 지우고 `import { FONT_STACKS, MONO_STACK } from "./fonts";`를 추가한 뒤, `font: { sans: SANS, display: SANS, mono: MONO }`를 `font: { sans: FONT_STACKS.sans, display: FONT_STACKS.sans, mono: MONO_STACK }`로 바꾼다 (값은 이전과 같은 문자열).

`src/app/layout.tsx`: `import { pretendard } from "@/fonts";` → `import { fontVariables } from "@/fonts";`, `className={pretendard.variable}` → `className={fontVariables}`.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run tests/unit/fonts.test.ts`
Expected: PASS.

- [ ] **Step 6: 매니페스트 갱신**

`CLAUDE.md`:
- 매니페스트 표의 `| Pretendard | …` 행 바로 아래에 두 행 추가:
```
| Hahmlet | google-fonts@9710da1eacb3 | `src/fonts/fonts.json#Hahmlet` | Git에 포함 (OFL-1.1) |
| Black Han Sans | google-fonts@9710da1eacb3 | `src/fonts/fonts.json#Black Han Sans` | Git에 포함 (OFL-1.1) |
```
- 디렉터리 표의 `src/fonts/` 행 설명을 `셀프호스팅 폰트(Pretendard, Hahmlet 명조, Black Han Sans 디스플레이) + \`fonts.json\`(버전·출처·라이선스) + \`registry.ts\``로 바꾼다.

Run: `npm run doctor`
Expected: 모든 항목 `✓` (새 글꼴 파일·라이선스·매니페스트 행 포함), `환경이 매니페스트와 일치합니다.`

- [ ] **Step 7: 빌드 확인과 커밋**

Run: `npm run check && npm run build && ls out/_next/static/media/ | grep -E "Hahmlet|BlackHanSans" && grep -c 'as="font"' out/index.html`
Expected: check 통과; 두 글꼴 파일이 `out/_next/static/media/`에 있음; 프리로드되는 글꼴은 Pretendard 하나뿐이므로 `as="font"` 개수가 `1`.

Run: `npm run pdf && npm run e2e`
Expected: 기존과 동일하게 통과 (테마 외형 불변).

```bash
git add -A
git commit -m "feat(fonts): add Hahmlet serif and Black Han Sans display fonts with registry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 테마 모델 확장 (태그·설명·defineTheme)

**Files:**
- Create: `src/themes/define.ts`
- Modify: `src/themes/types.ts`, `src/themes/base.ts`, `src/themes/paper.ts`, `src/themes/ink.ts`, `src/themes/signal.ts`
- Test: `tests/unit/theme-rules.test.ts`

**Interfaces:**
- Consumes: Task 1 `FONT_STACKS`, `MONO_STACK`.
- Produces:
  - `types.ts`: `THEME_TAGS` (Global Constraints 순서), `type ThemeTag`, `Theme`에 `description: string`, `tags: readonly ThemeTag[]` 추가, `type ThemeTokens = Omit<Theme, "label" | "description" | "tags" | "color">`.
  - `define.ts`: `type DeepPartial<T>` (배열·튜플은 통째), `mergeTokens<T extends object>(base: T, override?: DeepPartial<T>): T`, `type ThemeSpec = Pick<Theme, "label" | "description" | "tags" | "color"> & { tokens?: DeepPartial<ThemeTokens> }`, `defineTheme(spec: ThemeSpec): Theme`.
  - `base.ts`: `baseTokens: ThemeTokens`.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/theme-rules.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { themeNames, themes } from "@/themes";
import { baseTokens } from "@/themes/base";
import { defineTheme, type ThemeSpec } from "@/themes/define";
import { FONT_STACKS, MONO_STACK } from "@/themes/fonts";
import { THEME_TAGS, type Theme } from "@/themes/types";

const stacks: string[] = Object.values(FONT_STACKS);

const tokensOf = (theme: Theme) => ({
  font: theme.font,
  type: theme.type,
  leading: theme.leading,
  tracking: theme.tracking,
  space: theme.space,
  radius: theme.radius,
  motion: theme.motion,
});

describe.each(themeNames)("%s 테마 규칙", (name) => {
  const theme = themes[name];

  it("태그 1~3개, 모두 THEME_TAGS 소속, 중복 없음", () => {
    expect(theme.tags.length).toBeGreaterThanOrEqual(1);
    expect(theme.tags.length).toBeLessThanOrEqual(3);
    for (const tag of theme.tags) expect(THEME_TAGS).toContain(tag);
    expect(new Set(theme.tags).size).toBe(theme.tags.length);
  });

  it("설명이 비어 있지 않다", () => {
    expect(theme.description.trim()).not.toBe("");
  });

  it("글꼴은 등록된 스택만 쓴다", () => {
    expect(stacks).toContain(theme.font.sans);
    expect(stacks).toContain(theme.font.display);
    expect(theme.font.mono).toBe(MONO_STACK);
  });
});

describe("defineTheme", () => {
  const make = (tokens?: ThemeSpec["tokens"]) =>
    defineTheme({ label: "T", description: "d", tags: ["학술"], color: themes.paper.color, tokens });

  it("tokens가 없으면 기본 토큰 그대로", () => {
    expect(tokensOf(make())).toEqual(baseTokens);
  });

  it("지정한 하위 키만 바뀐다", () => {
    const theme = make({ type: { landscape: { h1: 70 } }, radius: 0 });
    expect(theme.type.landscape.h1).toBe(70);
    expect(theme.type.landscape.body).toBe(baseTokens.type.landscape.body);
    expect(theme.type.portrait).toEqual(baseTokens.type.portrait);
    expect(theme.radius).toBe(0);
    expect(theme.motion).toEqual(baseTokens.motion);
  });

  it("배열은 통째로 바뀐다", () => {
    const gap = [4, 8, 12, 20, 32, 48] as const;
    const theme = make({ space: { gap }, motion: { easing: { standard: [0, 0, 1, 1] } } });
    expect(theme.space.gap).toEqual(gap);
    expect(theme.space.pad).toEqual(baseTokens.space.pad);
    expect(theme.motion.easing.standard).toEqual([0, 0, 1, 1]);
    expect(theme.motion.easing.emphasized).toEqual(baseTokens.motion.easing.emphasized);
  });

  it("기본 토큰을 바꾸지 않는다", () => {
    const before = structuredClone(baseTokens);
    make({ type: { landscape: { h1: 1 } }, space: { pad: { portrait: 1 } }, radius: 0 });
    expect(baseTokens).toEqual(before);
  });

  it("이름·설명·태그·색은 spec 그대로", () => {
    const theme = make();
    expect(theme.label).toBe("T");
    expect(theme.description).toBe("d");
    expect(theme.tags).toEqual(["학술"]);
    expect(theme.color).toEqual(themes.paper.color);
  });
});

describe("기존 테마 유지", () => {
  it.each(["paper", "ink", "signal"] as const)("%s는 기본 토큰을 그대로 쓴다", (name) => {
    expect(tokensOf(themes[name])).toEqual(baseTokens);
  });

  it("색 값이 그대로다", () => {
    expect(themes.paper.color).toEqual({
      bg: "#FAFAF7", surface: "#FFFFFF", fg: "#1A1A1A", muted: "#5C5C5C", accent: "#2F5BEA", accentFg: "#FFFFFF", border: "#E2E2DC",
    });
    expect(themes.ink.color).toEqual({
      bg: "#0F1115", surface: "#1A1D24", fg: "#F2F2F0", muted: "#A3A7B0", accent: "#7AA2FF", accentFg: "#0F1115", border: "#2A2E37",
    });
    expect(themes.signal.color).toEqual({
      bg: "#B8321C", surface: "#A02B17", fg: "#FFFFFF", muted: "#FFE3DC", accent: "#1A1A1A", accentFg: "#FFFFFF", border: "#D9563F",
    });
  });
});
```

Run: `npx vitest run tests/unit/theme-rules.test.ts`
Expected: FAIL — `Failed to resolve import "@/themes/define"` (또는 `THEME_TAGS` 없음).

- [ ] **Step 2: 타입 확장**

`src/themes/types.ts`: 파일 끝 `Theme` 타입 위에 추가:
```ts
/** 갤러리 필터 순서이기도 하다 */
export const THEME_TAGS = ["논문", "학술", "산뜻", "차분", "화려", "색채", "다크", "미니멀", "비즈니스", "따뜻함"] as const;
export type ThemeTag = (typeof THEME_TAGS)[number];
```
`Theme` 타입의 `label: string;` 아래에 추가:
```ts
  /** 한 줄 설명. 갤러리 카드·상세에 표시 */
  description: string;
  /** 1~3개, 중복 없음 */
  tags: readonly ThemeTag[];
```
파일 끝에 추가:
```ts
/** 색·이름·설명·태그를 뺀 디자인 토큰 */
export type ThemeTokens = Omit<Theme, "label" | "description" | "tags" | "color">;
```

`src/themes/base.ts`: `import type { Theme } from "./types";` → `import type { ThemeTokens } from "./types";`, `export const baseTokens: Omit<Theme, "label" | "color"> = {` → `export const baseTokens: ThemeTokens = {`, 주석 `/** 색을 제외한 공통 토큰. 각 테마는 색과 이름만 정한다. */` → `/** 모든 테마의 기본 토큰. 테마는 defineTheme()으로 다른 부분만 덮어쓴다. */`.

- [ ] **Step 3: defineTheme**

`src/themes/define.ts`:
```ts
import { baseTokens } from "./base";
import type { Theme, ThemeTokens } from "./types";

/** 객체는 하위 키까지 선택적으로, 배열·튜플은 통째로 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type ThemeSpec = Pick<Theme, "label" | "description" | "tags" | "color"> & {
  /** 기본 토큰과 다른 부분만 */
  tokens?: DeepPartial<ThemeTokens>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** base를 바꾸지 않고, override의 객체는 하위 키 단위로 병합하고 그 밖의 값(배열 포함)은 교체한다. */
export function mergeTokens<T extends object>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = merged[key];
    merged[key] = isPlainObject(value) && isPlainObject(current) ? mergeTokens(current, value) : value;
  }
  return merged as T;
}

export function defineTheme(spec: ThemeSpec): Theme {
  const { tokens, ...identity } = spec;
  return { ...mergeTokens(baseTokens, tokens), ...identity };
}
```

- [ ] **Step 4: 기존 테마를 defineTheme으로**

`src/themes/paper.ts` (전체 교체):
```ts
import { defineTheme } from "./define";

export const paper = defineTheme({
  label: "Paper",
  description: "따뜻한 흰 배경에 검정 글자, 파랑 포인트 하나. 강의·문서형 기본값",
  tags: ["학술", "차분", "미니멀"],
  color: {
    bg: "#FAFAF7",
    surface: "#FFFFFF",
    fg: "#1A1A1A",
    muted: "#5C5C5C",
    accent: "#2F5BEA",
    accentFg: "#FFFFFF",
    border: "#E2E2DC",
  },
});
```

`src/themes/ink.ts` (전체 교체):
```ts
import { defineTheme } from "./define";

export const ink = defineTheme({
  label: "Ink",
  description: "어두운 배경의 고대비. 프로젝터·어두운 장소용",
  tags: ["다크", "차분", "미니멀"],
  color: {
    bg: "#0F1115",
    surface: "#1A1D24",
    fg: "#F2F2F0",
    muted: "#A3A7B0",
    accent: "#7AA2FF",
    accentFg: "#0F1115",
    border: "#2A2E37",
  },
});
```

`src/themes/signal.ts` (전체 교체):
```ts
import { defineTheme } from "./define";

export const signal = defineTheme({
  label: "Signal",
  description: "강한 빨강 배경에 흰 글자. 표지·섹션 구분·모션용",
  tags: ["화려", "색채"],
  color: {
    bg: "#B8321C",
    surface: "#A02B17",
    fg: "#FFFFFF",
    muted: "#FFE3DC",
    accent: "#1A1A1A",
    accentFg: "#FFFFFF",
    border: "#D9563F",
  },
});
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run tests/unit/theme-rules.test.ts tests/unit/themes.test.ts`
Expected: PASS.

Run: `npm run check`
Expected: 통과. (`src/themes/index.ts`의 `satisfies Record<string, Theme>`가 새 필드를 강제한다.)

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(themes): add tags, descriptions and defineTheme token merging

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 신규 테마 10개와 스타일 프리셋

**Files:**
- Create: `src/themes/presets.ts`, `src/themes/thesis.ts`, `src/themes/journal.ts`, `src/themes/lecture.ts`, `src/themes/breeze.ts`, `src/themes/mint.ts`, `src/themes/slate.ts`, `src/themes/boardroom.ts`, `src/themes/neon.ts`, `src/themes/pop.ts`, `src/themes/terracotta.ts`
- Modify: `src/themes/index.ts`, `tests/unit/themes.test.ts`, `tests/unit/theme-rules.test.ts`, `CLAUDE.md`

**Interfaces:**
- Consumes: Task 1 `FONT_STACKS`; Task 2 `defineTheme`, `DeepPartial`, `ThemeTokens`, `THEME_TAGS`.
- Produces: `src/themes/presets.ts` → `academicTokens`, `vividTokens` (`DeepPartial<ThemeTokens>`); `themes`에 13개 (Global Constraints 순서).

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/unit/themes.test.ts`의
```ts
    expect(themeNames).toEqual(["paper", "ink", "signal"]);
```
를 다음으로 바꾼다:
```ts
    expect(themeNames).toEqual([
      "paper", "ink", "signal", "thesis", "journal", "lecture", "breeze", "mint", "slate", "boardroom", "neon", "pop", "terracotta",
    ]);
```

`tests/unit/theme-rules.test.ts` 끝에 추가 (import 줄에 `import { academicTokens, vividTokens } from "@/themes/presets";` 추가):
```ts
describe("태그 분포", () => {
  it.each([...THEME_TAGS])("'%s' 태그는 2개 이상의 테마가 쓴다", (tag) => {
    const users = themeNames.filter((name) => themes[name].tags.includes(tag));
    expect(users.length).toBeGreaterThanOrEqual(2);
  });
});

describe("스타일 프리셋", () => {
  it.each(["thesis", "journal"] as const)("%s는 논문 스케일·명조", (name) => {
    const theme = themes[name];
    expect(theme.type).toEqual(academicTokens.type);
    expect(theme.leading.normal).toBe(1.7);
    expect(theme.space.pad).toEqual({ landscape: 144, portrait: 112 });
    expect(theme.radius).toBe(0);
    expect(theme.font.sans).toBe(FONT_STACKS.serif);
    expect(theme.font.display).toBe(FONT_STACKS.serif);
  });

  it.each(["neon", "pop"] as const)("%s는 화려 스케일·모션·디스플레이 글꼴", (name) => {
    const theme = themes[name];
    expect(theme.type.landscape).toMatchObject(vividTokens.type!.landscape!);
    expect(theme.type.portrait).toMatchObject(vividTokens.type!.portrait!);
    expect(theme.motion.duration).toEqual({ fast: 0.14, base: 0.28, slow: 0.55 });
    expect(theme.font.display).toBe(FONT_STACKS.display);
  });

  it("terracotta는 명조 제목", () => {
    expect(themes.terracotta.font.display).toBe(FONT_STACKS.serif);
    expect(themes.terracotta.font.sans).toBe(FONT_STACKS.sans);
  });
});
```

Run: `npx vitest run tests/unit/themes.test.ts tests/unit/theme-rules.test.ts`
Expected: FAIL — `@/themes/presets` 해석 실패.

- [ ] **Step 2: 프리셋**

`src/themes/presets.ts`:
```ts
import type { DeepPartial } from "./define";
import type { ThemeTokens } from "./types";

/** 논문·학술지: 작은 스케일, 넓은 행간·여백, 각진 모서리 */
export const academicTokens: DeepPartial<ThemeTokens> = {
  type: {
    landscape: { display: 112, h1: 72, h2: 52, body: 34, caption: 24 },
    portrait: { display: 96, h1: 64, h2: 48, body: 34, caption: 26 },
  },
  leading: { normal: 1.7 },
  space: { pad: { landscape: 144, portrait: 112 } },
  radius: 0,
};

/** 화려: 큰 제목 스케일, 빠른 모션 */
export const vividTokens: DeepPartial<ThemeTokens> = {
  type: {
    landscape: { display: 168, h1: 108, h2: 72 },
    portrait: { display: 132, h1: 92, h2: 64 },
  },
  motion: { duration: { fast: 0.14, base: 0.28, slow: 0.55 } },
};
```

- [ ] **Step 3: 테마 10개**

`src/themes/thesis.ts`:
```ts
import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { academicTokens } from "./presets";

export const thesis = defineTheme({
  label: "Thesis",
  description: "순백 바탕에 검정 명조, 남색 포인트. 논문·학회 발표용",
  tags: ["논문", "학술", "미니멀"],
  color: {
    bg: "#FFFFFF",
    surface: "#F5F5F2",
    fg: "#111111",
    muted: "#555555",
    accent: "#1F3A68",
    accentFg: "#FFFFFF",
    border: "#D9D9D4",
  },
  tokens: { ...academicTokens, font: { sans: FONT_STACKS.serif, display: FONT_STACKS.serif } },
});
```

`src/themes/journal.ts`:
```ts
import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { academicTokens } from "./presets";

export const journal = defineTheme({
  label: "Journal",
  description: "아이보리 바탕의 명조와 짙은 버건디. 학술지 지면 느낌",
  tags: ["논문", "학술", "따뜻함"],
  color: {
    bg: "#FBF7EE",
    surface: "#F3EDE0",
    fg: "#2A2420",
    muted: "#5E554C",
    accent: "#7A1E2C",
    accentFg: "#FFFFFF",
    border: "#E2D9C8",
  },
  tokens: { ...academicTokens, font: { sans: FONT_STACKS.serif, display: FONT_STACKS.serif } },
});
```

`src/themes/lecture.ts`:
```ts
import { defineTheme } from "./define";

export const lecture = defineTheme({
  label: "Lecture",
  description: "흰 바탕에 청록 포인트. 강의·튜토리얼용",
  tags: ["학술", "산뜻"],
  color: {
    bg: "#FFFFFF",
    surface: "#F2F7F7",
    fg: "#16232A",
    muted: "#4E5D63",
    accent: "#0F766E",
    accentFg: "#FFFFFF",
    border: "#D7E3E3",
  },
});
```

`src/themes/breeze.ts`:
```ts
import { defineTheme } from "./define";

export const breeze = defineTheme({
  label: "Breeze",
  description: "아주 옅은 하늘색과 남색 글자, 넓은 여백",
  tags: ["산뜻", "미니멀"],
  color: {
    bg: "#F2F7FC",
    surface: "#FFFFFF",
    fg: "#12263F",
    muted: "#4A5D75",
    accent: "#2563EB",
    accentFg: "#FFFFFF",
    border: "#D6E2F0",
  },
  tokens: { space: { pad: { landscape: 144, portrait: 112 } } },
});
```

`src/themes/mint.ts`:
```ts
import { defineTheme } from "./define";

export const mint = defineTheme({
  label: "Mint",
  description: "민트 바탕에 진녹 글자, 코랄 포인트",
  tags: ["산뜻", "색채"],
  color: {
    bg: "#DDF5EA",
    surface: "#F2FBF6",
    fg: "#0F3B2E",
    muted: "#2F5D4F",
    accent: "#C2410C",
    accentFg: "#FFFFFF",
    border: "#B7E4CF",
  },
});
```

`src/themes/slate.ts`:
```ts
import { defineTheme } from "./define";

export const slate = defineTheme({
  label: "Slate",
  description: "회청색 표면과 진회색 글자. 보고서·제안서용",
  tags: ["비즈니스", "차분"],
  color: {
    bg: "#F4F6F8",
    surface: "#E7EBEF",
    fg: "#1E2933",
    muted: "#4F5D6B",
    accent: "#3B5B7A",
    accentFg: "#FFFFFF",
    border: "#CBD3DB",
  },
  tokens: { radius: 8 },
});
```

`src/themes/boardroom.ts`:
```ts
import { defineTheme } from "./define";

export const boardroom = defineTheme({
  label: "Boardroom",
  description: "짙은 남색 바탕에 금색 포인트. 임원 보고용",
  tags: ["비즈니스", "다크"],
  color: {
    bg: "#0F1B2D",
    surface: "#172741",
    fg: "#F1F4F8",
    muted: "#A9B6C8",
    accent: "#D4AF37",
    accentFg: "#0F1B2D",
    border: "#26385A",
  },
  tokens: { radius: 8 },
});
```

`src/themes/neon.ts`:
```ts
import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { vividTokens } from "./presets";

export const neon = defineTheme({
  label: "Neon",
  description: "검정에 가까운 바탕과 마젠타 포인트, 굵은 디스플레이 제목",
  tags: ["화려", "다크", "색채"],
  color: {
    bg: "#0B0B12",
    surface: "#161626",
    fg: "#F5F5FF",
    muted: "#B4B4D0",
    accent: "#FF2BD6",
    accentFg: "#0B0B12",
    border: "#2A2A44",
  },
  tokens: { ...vividTokens, font: { display: FONT_STACKS.display } },
});
```

`src/themes/pop.ts`:
```ts
import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";
import { vividTokens } from "./presets";

export const pop = defineTheme({
  label: "Pop",
  description: "쨍한 노랑 바탕에 검정 글자, 큰 둥근 모서리",
  tags: ["화려", "색채"],
  color: {
    bg: "#FFD60A",
    surface: "#FFE55C",
    fg: "#111111",
    muted: "#3D3500",
    accent: "#111111",
    accentFg: "#FFD60A",
    border: "#E6BE00",
  },
  tokens: { ...vividTokens, radius: 40, font: { display: FONT_STACKS.display } },
});
```

`src/themes/terracotta.ts`:
```ts
import { defineTheme } from "./define";
import { FONT_STACKS } from "./fonts";

export const terracotta = defineTheme({
  label: "Terracotta",
  description: "베이지 바탕에 테라코타 포인트, 명조 제목",
  tags: ["따뜻함", "차분"],
  color: {
    bg: "#F5EDE3",
    surface: "#FBF6F0",
    fg: "#3A2A20",
    muted: "#6B5547",
    accent: "#A4472A",
    accentFg: "#FFFFFF",
    border: "#E3D3C2",
  },
  tokens: { font: { display: FONT_STACKS.serif } },
});
```

`src/themes/index.ts` (전체 교체):
```ts
import { boardroom } from "./boardroom";
import { breeze } from "./breeze";
import { ink } from "./ink";
import { journal } from "./journal";
import { lecture } from "./lecture";
import { mint } from "./mint";
import { neon } from "./neon";
import { paper } from "./paper";
import { pop } from "./pop";
import { signal } from "./signal";
import { slate } from "./slate";
import { terracotta } from "./terracotta";
import { thesis } from "./thesis";
import type { Theme } from "./types";

export const themes = {
  paper,
  ink,
  signal,
  thesis,
  journal,
  lecture,
  breeze,
  mint,
  slate,
  boardroom,
  neon,
  pop,
  terracotta,
} satisfies Record<string, Theme>;
export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

export function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(themes, value);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/themes.test.ts tests/unit/theme-rules.test.ts`
Expected: PASS — 13개 테마 모두 대비·스케일·gap·태그·글꼴 규칙 통과, 태그 10종 모두 2개 이상.

(대비 값 참고 — 계획 작성 시 계산: 가장 낮은 쌍은 breeze accentFg/accent 5.17, mint accentFg/accent 5.18.)

- [ ] **Step 5: 문서**

`CLAUDE.md`:
- 디렉터리 표의 `src/themes/` 행 설명을 `테마 13개(태그로 분류, \`defineTheme\`) → CSS 변수`로 바꾼다.
- `### 테마 추가` 섹션 전체(제목 다음 줄부터 `### draft → 공개` 직전까지)를 다음으로 교체:
```markdown
1. `src/themes/<name>.ts`에서 `defineTheme({ label, description, tags, color, tokens? })`로 정의하고 `src/themes/index.ts`의 `themes`에 등록한다.
   - `tokens`에는 기본값(`src/themes/base.ts`)과 다른 부분만 적는다. 객체는 하위 키 단위로 병합되고 배열(gap, easing)은 통째로 바뀐다. 스타일 프리셋: `academicTokens`(논문 스케일), `vividTokens`(화려 스케일·모션) — `src/themes/presets.ts`.
   - 글꼴은 `src/themes/fonts.ts`의 `FONT_STACKS.sans|serif|display`만 쓴다. 새 글꼴이 필요하면 `src/fonts/`에 파일·라이선스를 넣고 `fonts.json`, `src/fonts/registry.ts`, `src/fonts/index.ts`(`preload: false`), 위 매니페스트 표에 함께 추가한다.
   - 태그는 `THEME_TAGS`(`src/themes/types.ts`) 중 1~3개. 모든 태그는 2개 이상의 테마가 써야 한다.
2. `npm run test` — 대비 4.5:1, 타입 스케일 순서, 태그·글꼴 규칙을 검사한다. `npm run dev` 후 `/public-posts/gallery/`에서 확인한다.

태그: 논문 · 학술 · 산뜻 · 차분 · 화려 · 색채 · 다크 · 미니멀 · 비즈니스 · 따뜻함

| 테마 | 태그 | 설명 |
|---|---|---|
| `paper` | 학술 · 차분 · 미니멀 | 따뜻한 흰 배경에 검정 글자, 파랑 포인트 하나. 강의·문서형 기본값 |
| `ink` | 다크 · 차분 · 미니멀 | 어두운 배경의 고대비. 프로젝터·어두운 장소용 |
| `signal` | 화려 · 색채 | 강한 빨강 배경에 흰 글자. 표지·섹션 구분·모션용 |
| `thesis` | 논문 · 학술 · 미니멀 | 순백 바탕에 검정 명조, 남색 포인트. 논문·학회 발표용 |
| `journal` | 논문 · 학술 · 따뜻함 | 아이보리 바탕의 명조와 짙은 버건디. 학술지 지면 느낌 |
| `lecture` | 학술 · 산뜻 | 흰 바탕에 청록 포인트. 강의·튜토리얼용 |
| `breeze` | 산뜻 · 미니멀 | 아주 옅은 하늘색과 남색 글자, 넓은 여백 |
| `mint` | 산뜻 · 색채 | 민트 바탕에 진녹 글자, 코랄 포인트 |
| `slate` | 비즈니스 · 차분 | 회청색 표면과 진회색 글자. 보고서·제안서용 |
| `boardroom` | 비즈니스 · 다크 | 짙은 남색 바탕에 금색 포인트. 임원 보고용 |
| `neon` | 화려 · 다크 · 색채 | 검정에 가까운 바탕과 마젠타 포인트, 굵은 디스플레이 제목 |
| `pop` | 화려 · 색채 | 쨍한 노랑 바탕에 검정 글자, 큰 둥근 모서리 |
| `terracotta` | 따뜻함 · 차분 | 베이지 바탕에 테라코타 포인트, 명조 제목 |
```

- [ ] **Step 6: 전체 검사와 커밋**

Run: `npm run check && npm run build && npm run pdf && npm run e2e && npm run doctor`
Expected: 모두 통과 (기존 덱은 paper·ink·signal만 쓰므로 변화 없음).

```bash
git add -A
git commit -m "feat(themes): add ten tagged themes with academic and vivid presets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 갤러리 상태 로직

**Files:**
- Create: `src/gallery/query.ts`
- Test: `tests/unit/gallery-query.test.ts`

**Interfaces:**
- Consumes: `themes`, `themeNames`, `isThemeName`, `ThemeName` (`@/themes`); `THEME_TAGS`, `ThemeTag` (`@/themes/types`).
- Produces:
  - `MAX_SELECTION = 3`
  - `type GalleryState = { tag: ThemeTag | null; selected: ThemeName[] }`
  - `isThemeTag(value: string): value is ThemeTag`
  - `filterThemes(tag: ThemeTag | null, names?: readonly ThemeName[]): ThemeName[]` (기본 `themeNames`, 순서 유지)
  - `toggleSelection(selected: readonly ThemeName[], name: ThemeName, max?: number): ThemeName[]`
  - `parseGalleryQuery(search: string): GalleryState`
  - `formatGalleryQuery(state: GalleryState): string` (`""` 또는 `?`로 시작)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/gallery-query.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  MAX_SELECTION,
  filterThemes,
  formatGalleryQuery,
  isThemeTag,
  parseGalleryQuery,
  toggleSelection,
} from "@/gallery/query";
import { themeNames } from "@/themes";

describe("filterThemes", () => {
  it("null이면 전체, 등록 순서 유지", () => {
    expect(filterThemes(null)).toEqual(themeNames);
  });
  it("태그를 가진 테마만, 등록 순서 유지", () => {
    expect(filterThemes("논문")).toEqual(["thesis", "journal"]);
    expect(filterThemes("다크")).toEqual(["ink", "boardroom", "neon"]);
  });
});

describe("toggleSelection", () => {
  it("없으면 뒤에 추가, 있으면 제거", () => {
    expect(toggleSelection([], "paper")).toEqual(["paper"]);
    expect(toggleSelection(["paper", "ink"], "paper")).toEqual(["ink"]);
  });
  it(`최대 ${MAX_SELECTION}개, 넘으면 가장 먼저 고른 것을 뺀다`, () => {
    expect(toggleSelection(["paper", "ink", "signal"], "thesis")).toEqual(["ink", "signal", "thesis"]);
  });
  it("입력 배열을 바꾸지 않는다", () => {
    const selected = ["paper"] as const;
    toggleSelection(selected, "ink");
    expect(selected).toEqual(["paper"]);
  });
});

describe("parseGalleryQuery", () => {
  it("빈 쿼리는 기본 상태", () => {
    expect(parseGalleryQuery("")).toEqual({ tag: null, selected: [] });
  });
  it("태그와 선택을 읽는다", () => {
    expect(parseGalleryQuery("?tag=학술&sel=thesis,mint")).toEqual({ tag: "학술", selected: ["thesis", "mint"] });
  });
  it("모르는 태그·이름, 중복, 빈 항목은 버린다", () => {
    expect(parseGalleryQuery("?tag=없는태그&sel=thesis,nope,,mint,thesis")).toEqual({ tag: null, selected: ["thesis", "mint"] });
  });
  it(`선택은 앞에서부터 ${MAX_SELECTION}개까지`, () => {
    expect(parseGalleryQuery("?sel=paper,ink,signal,thesis").selected).toEqual(["paper", "ink", "signal"]);
  });
  it("퍼센트 인코딩된 값도 읽는다", () => {
    expect(parseGalleryQuery("?tag=%EB%85%BC%EB%AC%B8&sel=thesis%2Cjournal")).toEqual({ tag: "논문", selected: ["thesis", "journal"] });
  });
});

describe("formatGalleryQuery", () => {
  it("기본 상태는 빈 문자열", () => {
    expect(formatGalleryQuery({ tag: null, selected: [] })).toBe("");
  });
  it("parse와 왕복한다 (한글 태그 포함)", () => {
    const state = { tag: "따뜻함" as const, selected: ["journal" as const, "terracotta" as const] };
    const query = formatGalleryQuery(state);
    expect(query.startsWith("?")).toBe(true);
    expect(parseGalleryQuery(query)).toEqual(state);
  });
  it("선택만 있으면 sel만", () => {
    expect(parseGalleryQuery(formatGalleryQuery({ tag: null, selected: ["pop"] }))).toEqual({ tag: null, selected: ["pop"] });
  });
});

describe("isThemeTag", () => {
  it("THEME_TAGS만 인정", () => {
    expect(isThemeTag("미니멀")).toBe(true);
    expect(isThemeTag("minimal")).toBe(false);
  });
});
```

Run: `npx vitest run tests/unit/gallery-query.test.ts`
Expected: FAIL — `Failed to resolve import "@/gallery/query"`.

- [ ] **Step 2: 구현**

`src/gallery/query.ts`:
```ts
import { isThemeName, themeNames, themes, type ThemeName } from "@/themes";
import { THEME_TAGS, type ThemeTag } from "@/themes/types";

export const MAX_SELECTION = 3;

export type GalleryState = { tag: ThemeTag | null; selected: ThemeName[] };

export function isThemeTag(value: string): value is ThemeTag {
  return (THEME_TAGS as readonly string[]).includes(value);
}

export function filterThemes(tag: ThemeTag | null, names: readonly ThemeName[] = themeNames): ThemeName[] {
  return tag === null ? [...names] : names.filter((name) => themes[name].tags.includes(tag));
}

/** 선택/해제를 전환한다. max를 넘으면 가장 먼저 선택한 것부터 뺀다. */
export function toggleSelection(selected: readonly ThemeName[], name: ThemeName, max = MAX_SELECTION): ThemeName[] {
  if (selected.includes(name)) return selected.filter((item) => item !== name);
  const next = [...selected, name];
  return next.length > max ? next.slice(next.length - max) : next;
}

/** ?tag=<태그>&sel=<이름>,<이름> — 모르는 값·중복은 버리고 선택은 앞에서부터 MAX_SELECTION개 */
export function parseGalleryQuery(search: string): GalleryState {
  const params = new URLSearchParams(search);
  const rawTag = params.get("tag");
  const tag = rawTag !== null && isThemeTag(rawTag) ? rawTag : null;
  const selected: ThemeName[] = [];
  for (const raw of (params.get("sel") ?? "").split(",")) {
    const name = raw.trim();
    if (isThemeName(name) && !selected.includes(name)) selected.push(name);
  }
  return { tag, selected: selected.slice(0, MAX_SELECTION) };
}

export function formatGalleryQuery(state: GalleryState): string {
  const params = new URLSearchParams();
  if (state.tag) params.set("tag", state.tag);
  if (state.selected.length > 0) params.set("sel", state.selected.join(","));
  const query = params.toString();
  return query ? `?${query}` : "";
}
```

- [ ] **Step 3: 테스트 통과 확인**

Run: `npx vitest run tests/unit/gallery-query.test.ts`
Expected: PASS.

- [ ] **Step 4: 커밋**

```bash
npm run check
git add -A
git commit -m "feat(gallery): add tag filter, selection and URL state logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 갤러리 화면 (필터·카드·상세 비교)

**Files:**
- Create: `src/gallery/GalleryApp.tsx`, `src/gallery/ThemeCard.tsx`, `playwright.dev.config.ts`, `tests/dev/gallery.spec.ts`
- Modify: `src/gallery/ThemeColumn.tsx`, `src/app/gallery/page.dev.tsx`, `package.json` (스크립트 1개), `CLAUDE.md`

**Interfaces:**
- Consumes: Task 4 (`MAX_SELECTION`, `GalleryState`, `filterThemes`, `toggleSelection`, `parseGalleryQuery`, `formatGalleryQuery`), Task 1 `familyForStack`, `themes`/`ThemeName`, `THEME_TAGS`/`ThemeTag`, `StaticSlideFrame`, `SampleSlide`, `MotionTokenDemo`, `cn`.
- Produces (DOM 계약, dev E2E가 사용): 카드 `<article data-theme-card="<name>" data-selected="true|false">`, 카드 안 선택 버튼(이름에 "선택" 포함, `aria-pressed`), 카드 안 태그 버튼(이름 = 태그), 태그 필터 `<nav aria-label="태그 필터">`의 버튼("전체" + 태그), 헤더 버튼 "선택 해제", 상세 `<div data-theme-detail="<name>">`. npm 스크립트 `e2e:dev`.

- [ ] **Step 1: ThemeColumn 확장**

`src/gallery/ThemeColumn.tsx` (전체 교체):
```tsx
import type { ReactNode } from "react";
import { StaticSlideFrame } from "@/engine";
import { familyForStack } from "@/fonts/registry";
import { themes, type ThemeName } from "@/themes";
import { CONTRAST_PAIRS, MIN_CONTRAST, contrastRatio } from "@/themes/contrast";
import { ThemeScope } from "@/themes/ThemeScope";
import { COLOR_TOKENS, TYPE_STEPS, type TypeStep } from "@/themes/types";
import { MotionTokenDemo } from "./MotionTokenDemo";
import { SampleSlide } from "./SampleSlide";

const PREVIEW_SCALE = 0.3;
const HEADING_STEPS: readonly TypeStep[] = ["display", "h1", "h2"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** 표시용 대비비: 반올림하면 4.496이 4.50으로 보여 경고와 모순되므로 내림한다 */
function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

export function ThemeColumn({ name }: { name: ThemeName }) {
  const theme = themes[name];
  return (
    <ThemeScope name={name} data-theme-detail={name} className="flex flex-col gap-8 rounded-2xl bg-bg p-5 text-fg">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">
          {theme.label} <code className="text-sm font-normal text-muted">{name}</code>
        </h2>
        <p className="text-sm text-muted">{theme.description}</p>
        <div className="flex flex-wrap gap-1">
          {theme.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <Section title="색상">
        <div className="grid grid-cols-4 gap-2">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="flex flex-col gap-1 text-xs">
              <div className="h-10 rounded-md border border-border" style={{ background: theme.color[token] }} />
              <span className="font-mono">{token}</span>
              <span className="font-mono text-muted">{theme.color[token]}</span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-1 text-xs">
          {CONTRAST_PAIRS.map(([fg, bg]) => {
            const ratio = contrastRatio(theme.color[fg], theme.color[bg]);
            const ok = ratio >= MIN_CONTRAST;
            return (
              <li key={`${fg}-${bg}`} className="flex justify-between font-mono">
                <span>
                  {fg} / {bg}
                </span>
                <span className={ok ? "" : "font-bold underline"}>
                  {formatRatio(ratio)}:1 {ok ? "✓" : `⚠ ${MIN_CONTRAST} 미만`}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="글꼴">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted">본문</dt>
          <dd>{familyForStack(theme.font.sans)}</dd>
          <dt className="text-muted">제목</dt>
          <dd>{familyForStack(theme.font.display)}</dd>
          <dt className="text-muted">코드</dt>
          <dd>{familyForStack(theme.font.mono)}</dd>
        </dl>
      </Section>

      <Section title={`타이포그래피 (미리보기 ${PREVIEW_SCALE * 100}%)`}>
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr>
              <th className="text-left font-normal">단계</th>
              <th className="text-right font-normal">16:9</th>
              <th className="text-right font-normal">4:5</th>
              <th className="pl-3 text-left font-normal">견본</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_STEPS.map((step) => (
              <tr key={step}>
                <td className="font-mono">{step}</td>
                <td className="text-right font-mono">{theme.type.landscape[step]}</td>
                <td className="text-right font-mono">{theme.type.portrait[step]}</td>
                <td
                  className="pl-3 leading-tight"
                  style={{
                    fontSize: theme.type.landscape[step] * PREVIEW_SCALE,
                    fontFamily: HEADING_STEPS.includes(step) ? theme.font.display : theme.font.sans,
                  }}
                >
                  가나다 Aa
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="간격 · 라운드">
        <div className="flex flex-col gap-1">
          {theme.space.gap.map((gap, i) => (
            <div key={`s${i + 1}`} className="flex items-center gap-3 text-xs">
              <span className="w-16 font-mono">
                s{i + 1} {gap}
              </span>
              <div className="h-2 rounded-sm bg-accent" style={{ width: gap * PREVIEW_SCALE * 3 }} />
            </div>
          ))}
        </div>
        <p className="font-mono text-xs">
          pad 16:9 {theme.space.pad.landscape} · 4:5 {theme.space.pad.portrait} · radius {theme.radius}
        </p>
      </Section>

      <Section title="모션">
        <MotionTokenDemo tokens={theme.motion} />
      </Section>

      <Section title="견본 슬라이드">
        <StaticSlideFrame canvas="landscape" theme={name}>
          <SampleSlide />
        </StaticSlideFrame>
        <div className="w-2/3">
          <StaticSlideFrame canvas="portrait" theme={name}>
            <SampleSlide />
          </StaticSlideFrame>
        </div>
      </Section>
    </ThemeScope>
  );
}
```
(`ThemeScope`는 나머지 div 속성을 그대로 넘기므로 `data-theme-detail`이 루트 div에 붙는다.)

- [ ] **Step 2: 카드와 앱**

`src/gallery/ThemeCard.tsx`:
```tsx
"use client";

import { StaticSlideFrame } from "@/engine";
import { cn } from "@/lib/cn";
import { themes, type ThemeName } from "@/themes";
import type { ThemeTag } from "@/themes/types";
import { SampleSlide } from "./SampleSlide";

type ThemeCardProps = {
  name: ThemeName;
  selected: boolean;
  onToggle: () => void;
  onTag: (tag: ThemeTag) => void;
};

export function ThemeCard({ name, selected, onToggle, onTag }: ThemeCardProps) {
  const theme = themes[name];
  return (
    <article
      data-theme-card={name}
      data-selected={selected}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm",
        selected ? "border-neutral-900" : "border-transparent",
      )}
    >
      {/* 썸네일 클릭은 마우스용 지름길. 키보드는 아래 선택 버튼을 쓴다. */}
      <div className="cursor-pointer" onClick={onToggle} aria-hidden>
        <StaticSlideFrame canvas="landscape" theme={name}>
          <SampleSlide />
        </StaticSlideFrame>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-bold">
            {theme.label} <code className="text-xs font-normal text-neutral-500">{name}</code>
          </h3>
          <button
            type="button"
            aria-pressed={selected}
            onClick={onToggle}
            className={cn(
              "shrink-0 rounded-md border px-2 py-0.5 text-xs",
              selected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300",
            )}
          >
            {selected ? "선택됨 ✓" : "선택"}
          </button>
        </div>
        <p className="text-xs text-neutral-600">{theme.description}</p>
        <div className="flex flex-wrap gap-1">
          {theme.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTag(tag)}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs hover:bg-neutral-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
```

`src/gallery/GalleryApp.tsx`:
```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { themeNames, type ThemeName } from "@/themes";
import { THEME_TAGS, type ThemeTag } from "@/themes/types";
import {
  MAX_SELECTION,
  filterThemes,
  formatGalleryQuery,
  parseGalleryQuery,
  toggleSelection,
  type GalleryState,
} from "./query";
import { ThemeCard } from "./ThemeCard";
import { ThemeColumn } from "./ThemeColumn";

function TagChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white",
      )}
    >
      {label}
    </button>
  );
}

export function GalleryApp() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<GalleryState>(() => parseGalleryQuery(searchParams.toString()));

  // 상태를 URL에 반영한다 (기록은 쌓지 않음). 잘못된 초기 쿼리도 여기서 정리된다.
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${formatGalleryQuery(state)}`);
  }, [state]);

  const visible = filterThemes(state.tag);
  const setTag = (tag: ThemeTag | null) => setState((current) => ({ ...current, tag }));
  const toggle = (name: ThemeName) =>
    setState((current) => ({ ...current, selected: toggleSelection(current.selected, name) }));
  const clearSelection = () => setState((current) => ({ ...current, selected: [] }));

  return (
    <main className="min-h-dvh bg-neutral-100 p-6 text-neutral-900">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">
            테마 갤러리 <span className="font-normal text-neutral-500">({themeNames.length})</span>
          </h1>
          <p className="text-sm text-neutral-600">
            개발 모드 전용 · 프로덕션 빌드에 포함되지 않음 · 정의: <code>src/themes/</code> · 카드를 눌러 최대{" "}
            {MAX_SELECTION}개까지 비교
          </p>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          disabled={state.selected.length === 0}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm disabled:opacity-40"
        >
          선택 해제
        </button>
      </header>

      <nav aria-label="태그 필터" className="mb-6 flex flex-wrap gap-2">
        <TagChip label="전체" active={state.tag === null} onClick={() => setTag(null)} />
        {THEME_TAGS.map((tag) => (
          <TagChip key={tag} label={tag} active={state.tag === tag} onClick={() => setTag(tag)} />
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="text-neutral-500">이 태그의 테마가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((name) => (
            <ThemeCard
              key={name}
              name={name}
              selected={state.selected.includes(name)}
              onToggle={() => toggle(name)}
              onTag={setTag}
            />
          ))}
        </div>
      )}

      {state.selected.length > 0 && (
        <section aria-label="선택한 테마 상세" className="mt-10 flex flex-col gap-4">
          <h2 className="text-lg font-bold">선택한 테마 상세 ({state.selected.join(" · ")})</h2>
          <div
            className={cn(
              "grid gap-6",
              state.selected.length === 2 && "xl:grid-cols-2",
              state.selected.length === 3 && "xl:grid-cols-3",
            )}
          >
            {state.selected.map((name) => (
              <ThemeColumn key={name} name={name} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
```

`src/app/gallery/page.dev.tsx` (전체 교체):
```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryApp } from "@/gallery/GalleryApp";

export const metadata: Metadata = { title: "테마 갤러리 (dev)" };

// useSearchParams를 쓰는 클라이언트 컴포넌트는 Suspense 경계 안에 둔다.
export default function GalleryPage() {
  return (
    <Suspense fallback={null}>
      <GalleryApp />
    </Suspense>
  );
}
```

Run: `npm run check`
Expected: 통과. 린트가 `ThemeCard`의 `onClick` 있는 `div`를 `jsx-a11y` 규칙으로 지적하면, 썸네일 div에 `role="presentation"`을 더해 해결한다(키보드 경로는 선택 버튼이 담당). 그 외 규칙 위반은 코드 구조로 해결한다.

- [ ] **Step 3: dev 서버 대상 갤러리 E2E**

`playwright.dev.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";
import { BASE_PATH } from "./site.config";

/** dev 전용 화면(갤러리) 검사. 프로덕션 빌드를 대상으로 하는 playwright.config.ts와 분리한다. */
export default defineConfig({
  testDir: "tests/dev",
  reporter: "list",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev",
    url: `http://localhost:3000${BASE_PATH}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
```

`package.json`의 `scripts`에 `"e2e": "playwright test",` 다음 줄로 추가:
```json
    "e2e:dev": "playwright test -c playwright.dev.config.ts",
```

`tests/dev/gallery.spec.ts`:
```ts
import { expect, test, type Page } from "@playwright/test";
import { sitePath } from "../e2e/helpers";

const GALLERY = sitePath("/gallery/");
const cards = (page: Page) => page.locator("[data-theme-card]");
const details = (page: Page) => page.locator("[data-theme-detail]");
const namesOf = (page: Page, selector: string, attribute: string) =>
  page.locator(selector).evaluateAll((els, attr) => els.map((el) => el.getAttribute(attr)), attribute);
const filterButton = (page: Page, label: string) =>
  page.getByRole("navigation", { name: "태그 필터" }).getByRole("button", { name: label, exact: true });
const selectButton = (page: Page, name: string) =>
  page.locator(`[data-theme-card="${name}"]`).getByRole("button", { name: /^선택/ });

test("13개 카드를 보여 주고 태그로 거르며 URL에 반영한다", async ({ page }) => {
  await page.goto(GALLERY);
  await expect(cards(page)).toHaveCount(13);
  await filterButton(page, "논문").click();
  await expect(cards(page)).toHaveCount(2);
  expect(await namesOf(page, "[data-theme-card]", "data-theme-card")).toEqual(["thesis", "journal"]);
  await expect(page).toHaveURL(/\?tag=%EB%85%BC%EB%AC%B8$/);
  await filterButton(page, "전체").click();
  await expect(cards(page)).toHaveCount(13);
});

test("URL에서 상태를 복원하고 잘못된 값은 버린다", async ({ page }) => {
  await page.goto(`${GALLERY}?tag=${encodeURIComponent("없는태그")}&sel=thesis,nope,mint,thesis`);
  await expect(cards(page)).toHaveCount(13);
  await expect(details(page)).toHaveCount(2);
  expect(await namesOf(page, "[data-theme-detail]", "data-theme-detail")).toEqual(["thesis", "mint"]);
  await expect(page).toHaveURL(/\?sel=thesis%2Cmint$/);
});

test("최대 3개 선택, 넷째를 고르면 가장 먼저 고른 것이 빠지고 필터를 바꿔도 선택은 남는다", async ({ page }) => {
  await page.goto(GALLERY);
  for (const name of ["paper", "ink", "signal", "thesis"]) await selectButton(page, name).click();
  await expect(details(page)).toHaveCount(3);
  expect(await namesOf(page, "[data-theme-detail]", "data-theme-detail")).toEqual(["ink", "signal", "thesis"]);

  await filterButton(page, "비즈니스").click();
  await expect(cards(page)).toHaveCount(2);
  await expect(details(page)).toHaveCount(3);

  await page.getByRole("button", { name: "선택 해제" }).click();
  await expect(details(page)).toHaveCount(0);
});

test("카드의 태그를 누르면 그 태그로 거른다", async ({ page }) => {
  await page.goto(GALLERY);
  await page.locator('[data-theme-card="ink"]').getByRole("button", { name: "다크", exact: true }).click();
  await expect(cards(page)).toHaveCount(3);
  expect(await namesOf(page, "[data-theme-card]", "data-theme-card")).toEqual(["ink", "boardroom", "neon"]);
});
```

Run: `npm run e2e:dev`
Expected: `4 passed`. (dev 서버를 Playwright가 띄우고 끝나면 내린다. 이미 3000번에 dev 서버가 떠 있으면 그것을 재사용한다.) 실행 후 `git status --short`에 `AGENTS.md`·`CLAUDE.md` 변경이 없어야 한다.

- [ ] **Step 4: 프로덕션 제외 확인**

Run: `npm run build && test ! -e out/gallery && npx playwright test tests/e2e/site.spec.ts`
Expected: 통과 (`out/gallery` 없음, `/gallery/` 404 테스트 PASS).

- [ ] **Step 5: 시각 확인**

`npm run dev` 후 브라우저로 `http://localhost:3000/public-posts/gallery/`를 열어 13개 카드의 색감·글꼴(thesis·journal 명조, neon·pop 디스플레이 제목, terracotta 명조 제목)을 확인한다. 브라우저를 쓸 수 없는 환경이면 그 사실을 보고서에 적는다.

- [ ] **Step 6: 문서**

`CLAUDE.md` 명령어 표의 `| \`npm run e2e\` | …` 행 아래에 추가:
```
| `npm run e2e:dev` | dev 서버 대상 갤러리 E2E (`tests/dev`) |
```
디렉터리 표의 `src/app/gallery/page.dev.tsx` 행 설명을 `테마 갤러리 (dev 전용, 빌드 제외) — 태그 필터·카드·최대 3개 비교, 상태는 URL(\`?tag=&sel=\`)`로 바꾼다.

- [ ] **Step 7: 전체 검사와 커밋**

Run: `npm run check && npm run build && npm run pdf && npm run e2e && npm run e2e:dev && npm run doctor && git status --short`
Expected: 모두 통과.

```bash
git add -A
git commit -m "feat(gallery): tag filter, theme cards and side-by-side detail with URL state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
