# Web Presentation Platform (public-posts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub Pages(프로젝트 사이트 `/public-posts`)에 정적 배포되는 슬라이드 덱·모션 그래픽 플랫폼을 Next.js로 구축하고, 배포 시 덱별 PDF를 자동 생성하며, 환경 재현 매니페스트(CLAUDE.md)를 `doctor` 스크립트로 검증한다.

**Architecture:** Next.js App Router 정적 export. 작업물(덱/모션)은 `content/`의 TSX 컴포넌트이고 `content/registry.ts`가 단일 출처다. 작업물 페이지는 클라이언트 전용으로 렌더되며, 자체 슬라이드 엔진(`src/engine`)이 발표/읽기/인쇄 모드와 16:9·4:5 두 캔버스를 처리한다. 테마는 TS 토큰 → CSS 변수 → Tailwind v4 `@theme` 유틸리티로 흐른다. 빌드 후 Playwright가 `?print` 페이지에서 오버플로를 검사하고 PDF를 만든다.

**Tech Stack:** Node 24.18.0, npm 11.16.0, Next.js 16.3.8, React 19.3.0, Motion 14.0.0, Tailwind CSS 4.3.3, TypeScript 6.0.3, ESLint 9.39.5 + eslint-config-next 16.3.8, Vitest 5.0.3, Playwright 1.63.0, tsx 4.23.15, Pretendard 1.3.9 (셀프호스팅).

**Spec:** `docs/superpowers/specs/2026-10-05-web-presentation-platform-design.md`

## Global Constraints

- basePath는 `/public-posts`이며 `site.config.ts`의 `BASE_PATH` 한 곳에서만 정의한다. 다른 파일은 이 상수를 import한다.
- `next.config.ts`: `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`, `pageExtensions`는 dev에서만 `dev.tsx` 포함.
- 버전 고정: `.nvmrc` = `24.18.0`, `package.json` `packageManager` = `npm@11.16.0`, `engines.node` = `>=24.18.0 <25`, `.npmrc` = `engine-strict=true` + `save-exact=true`. 모든 의존성은 정확한 버전으로 설치한다(`npm i -E`).
- TypeScript는 **6.0.3**으로 고정한다(7.x는 typescript-eslint 8의 peer 범위 `<6.1.0` 밖). ESLint는 **9.39.5**로 고정한다(10.x에서 eslint-plugin-react가 크래시).
- 캔버스 논리 크기: landscape `1920×1080`, portrait `1080×1350`. PDF는 항상 landscape.
- 화면에 버튼 없음(덱/모션 페이지). PDF는 어디에도 링크하지 않으며 `/public-posts/decks/<slug>.pdf`로만 접근한다.
- 세 테마(`paper`, `ink`, `signal`)는 `fg/bg`, `muted/bg`, `fg/surface`, `accentFg/accent` 대비 4.5:1 이상.
- 작업물 페이지(덱·모션)는 클라이언트 전용 렌더(`next/dynamic` + `ssr: false`). JS가 없으면 `<noscript>`로 제목·설명·안내만 표시한다.
- 공개(draft 아님) 작업물은 종류(deck/motion)별 최소 1개가 있어야 한다(Next 정적 export가 빈 `generateStaticParams`를 거부).
- UI 문구와 문서는 한국어. 코드 식별자는 영어.
- 커밋 메시지 끝에 다음 줄을 붙인다:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 작업 브랜치: `feat/platform` (main에서 분기). main 병합과 원격 push는 Task 12에서만.

## Review Focus

1. **한글 입력 상태의 단축키** — 한글 IME가 켜져 있으면 F/M/R 키의 `key`가 `ㄹ`/`ㅡ`/`ㄱ`가 된다. 단축키는 그대로 동작해야 한다 → `keyToCommand`/`stageKeyToCommand`가 `code`를 사용하고 Task 3 단위 테스트로 고정.
2. **잘못된 해시** — `#0`, `#99`, `#abc`로 들어와도 유효한 슬라이드로 보정되고 주소의 해시도 고쳐져야 한다 → Task 3 `parseHash` 테스트 + Task 7 E2E(`#99` → `#4`).
3. **회전(세로↔가로) 시 위치 유지** — 읽기 모드에서 3번 카드를 보다가 폰을 가로로 돌리면 발표 모드 3번 슬라이드여야 한다 → Task 7 모바일 E2E.
4. **모든 작업물을 draft로 바꾼 경우** — Next가 알아보기 힘든 오류로 빌드 실패한다. 레지스트리 검증이 원인을 한국어로 알려야 한다 → Task 4 `validateWorks` 테스트.
5. **로컬 정적 서버에 이상한 URL** — 깨진 퍼센트 인코딩, `..` 경로, basePath와 비슷한 접두어가 와도 서버가 죽지 않고 404/거부해야 한다 → Task 5 serve 테스트.

---

## File Structure

```
public-posts/
├─ CLAUDE.md                         # Task 10: 규칙 + 환경 매니페스트
├─ .nvmrc / .npmrc / .gitignore      # Task 1
├─ package.json / package-lock.json  # Task 1
├─ site.config.ts                    # Task 1: BASE_PATH, SITE_TITLE, SITE_DESCRIPTION
├─ next.config.ts / tsconfig.json / postcss.config.mjs / eslint.config.mjs / vitest.config.ts  # Task 1
├─ playwright.config.ts              # Task 5
├─ content/
│  ├─ registry.ts                    # Task 7: 작업물 목록 (Task 4는 테스트 픽스처만)
│  ├─ decks/hello/index.tsx          # Task 7
│  └─ motion/hello-motion/index.tsx  # Task 7
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx / globals.css    # Task 1 → Task 2에서 확장
│  │  ├─ page.tsx                    # Task 1 placeholder → Task 7 목록
│  │  ├─ not-found.tsx               # Task 7
│  │  ├─ decks/[slug]/page.tsx       # Task 7
│  │  ├─ motion/[slug]/page.tsx      # Task 7
│  │  └─ gallery/page.dev.tsx        # Task 8
│  ├─ fonts/                         # Task 2: woff2, LICENSE, fonts.json, index.ts
│  ├─ lib/cn.ts                      # Task 2
│  ├─ themes/                        # Task 2: types, base, paper, ink, signal, contrast, css-vars, index, ThemeScope
│  ├─ engine/                        # Task 3 (순수 로직) + Task 6 (컴포넌트)
│  ├─ works/                         # Task 4 (types, query, validate) + Task 7 (metadata, WorkClient, WorkView, NoScript)
│  └─ gallery/                       # Task 8: ThemeColumn, MotionTokenDemo, SampleSlide
├─ scripts/
│  ├─ lib/serve.ts / serve-out.ts    # Task 5
│  ├─ lib/pdf-targets.ts / export-pdf.ts  # Task 9
│  └─ lib/manifest.ts / doctor.ts    # Task 10
├─ tests/unit/*.test.ts              # Vitest
├─ tests/e2e/*.spec.ts               # Playwright
└─ .github/workflows/deploy.yml      # Task 11
```

책임 경계:
- `src/engine/*.ts`(확장자 `.ts`, React 없음): 순수 함수. 단위 테스트 대상. 스크립트(`scripts/`)도 import한다.
- `src/engine/*.tsx`: React 컴포넌트·훅. E2E로 검증.
- `src/works/query.ts`, `validate.ts`: 순수 함수. 서버 컴포넌트·스크립트·테스트에서 공용.
- `scripts/lib/*.ts`: Node 전용 순수/IO 함수. `scripts/*.ts`는 얇은 CLI 진입점.

---

### Task 1: 프로젝트 스캐폴드와 도구 버전 고정

**Files:**
- Create: `package.json`, `.nvmrc`, `.npmrc`, `.gitignore`, `site.config.ts`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Test: `tests/unit/site-config.test.ts`

**Interfaces:**
- Produces: `site.config.ts` → `export const BASE_PATH = "/public-posts"`, `export const SITE_TITLE = "public-posts"`, `export const SITE_DESCRIPTION: string`. npm 스크립트 `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `check`, `pdf`, `e2e`, `doctor`. 경로 별칭 `@/*` → `src/*`, `@content/*` → `content/*`.

- [ ] **Step 1: 작업 브랜치 생성**

```bash
cd /home/dragon/github/public-posts
git switch -c feat/platform
```

- [ ] **Step 2: 버전 고정 파일 작성**

`.nvmrc`:
```
24.18.0
```

`.npmrc`:
```
engine-strict=true
save-exact=true
```

`.gitignore`:
```
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo
test-results/
playwright-report/
coverage/
.env*.local
.DS_Store
```

`package.json`:
```json
{
  "name": "public-posts",
  "private": true,
  "version": "0.1.0",
  "packageManager": "npm@11.16.0",
  "engines": {
    "node": ">=24.18.0 <25"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "tsx scripts/serve-out.ts",
    "typecheck": "next typegen && tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "check": "npm run typecheck && npm run lint && npm run test",
    "pdf": "tsx scripts/export-pdf.ts",
    "e2e": "playwright test",
    "doctor": "tsx scripts/doctor.ts"
  }
}
```

- [ ] **Step 3: 의존성을 정확한 버전으로 설치**

```bash
npm i -E next@16.3.8 react@19.3.0 react-dom@19.3.0 motion@14.0.0
npm i -E -D typescript@6.0.3 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.1 \
  tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 \
  eslint@9.39.5 eslint-config-next@16.3.8 \
  vitest@5.0.3 @playwright/test@1.63.0 tsx@4.23.15
```
Expected: `package-lock.json` 생성, `package.json`의 버전에 `^`가 없음. 확인: `grep -c '"\^' package.json` → `0`.

- [ ] **Step 4: 설정 파일 작성**

`site.config.ts`:
```ts
export const BASE_PATH = "/public-posts";
export const SITE_TITLE = "public-posts";
export const SITE_DESCRIPTION = "웹에서 동작하는 발표 자료와 모션 그래픽";
```

`next.config.ts`:
```ts
import type { NextConfig } from "next";
import { BASE_PATH } from "./site.config";

const isDev = process.env.NODE_ENV !== "production";

const config: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  // *.dev.tsx 페이지(테마 갤러리)는 개발 모드에서만 라우트가 된다.
  pageExtensions: isDev ? ["tsx", "ts", "dev.tsx"] : ["tsx", "ts"],
};

export default config;
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@content/*": ["./content/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules", "out"]
}
```

`postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`eslint.config.mjs`:
```js
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

export default [
  ...next,
  ...ts,
  {
    ignores: [".next/**", "out/**", "next-env.d.ts", "test-results/**", "playwright-report/**"],
  },
];
```

`vitest.config.ts`:
```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: dir("./src/") },
      { find: /^@content\//, replacement: dir("./content/") },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 5: 최소 앱 작성**

`src/app/globals.css`:
```css
@import "tailwindcss";
```

`src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE_DESCRIPTION, SITE_TITLE } from "../../site.config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:
```tsx
import { SITE_TITLE } from "../../site.config";

export default function HomePage() {
  return <h1>{SITE_TITLE}</h1>;
}
```

- [ ] **Step 6: 실패하는 테스트 작성**

`tests/unit/site-config.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { BASE_PATH } from "../../site.config";

describe("BASE_PATH", () => {
  it("슬래시로 시작하고 슬래시로 끝나지 않는 단일 세그먼트다", () => {
    expect(BASE_PATH).toMatch(/^\/[a-z0-9-]+$/);
  });
});
```

Run: `npx vitest run tests/unit/site-config.test.ts`
Expected: PASS (설정 파일이 이미 있으므로 바로 통과한다. 이 테스트는 이후 basePath 오타를 막는 가드다). 만약 `site.config.ts`를 아직 만들지 않은 상태라면 "Failed to resolve import"로 FAIL.

- [ ] **Step 7: 전체 검사와 빌드**

Run: `npm run check`
Expected: typecheck·lint·test 모두 통과 (`Tests  1 passed`).

Run: `npm run build && ls out/index.html out/404.html`
Expected: 두 파일 모두 존재. Next가 `tsconfig.json`을 수정했다는 메시지를 출력하면 그 변경을 그대로 유지한다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Next.js static export with pinned toolchain

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 테마 시스템 (토큰, 대비, CSS 변수, 폰트)

**Files:**
- Create: `src/fonts/PretendardVariable.woff2`, `src/fonts/LICENSE-Pretendard.txt`, `src/fonts/fonts.json`, `src/fonts/index.ts`
- Create: `src/lib/cn.ts`
- Create: `src/themes/types.ts`, `src/themes/base.ts`, `src/themes/paper.ts`, `src/themes/ink.ts`, `src/themes/signal.ts`, `src/themes/contrast.ts`, `src/themes/css-vars.ts`, `src/themes/index.ts`, `src/themes/ThemeScope.tsx`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Test: `tests/unit/themes.test.ts`

**Interfaces:**
- Produces:
  - `src/themes/types.ts`: `CANVASES = ["landscape","portrait"] as const`, `type Canvas`, `TYPE_STEPS = ["display","h1","h2","body","caption"] as const`, `type TypeStep`, `COLOR_TOKENS`, `type ColorToken`, `type Bezier = [number, number, number, number]`, `type Theme`.
  - `src/themes/index.ts`: `themes: { paper; ink; signal }`, `type ThemeName = keyof typeof themes`, `themeNames: ThemeName[]`, `isThemeName(x: string): x is ThemeName`.
  - `src/themes/contrast.ts`: `parseHex(hex): [r,g,b]`, `relativeLuminance(hex): number`, `contrastRatio(a, b): number`, `MIN_CONTRAST = 4.5`, `CONTRAST_PAIRS: readonly (readonly [ColorToken, ColorToken])[]`.
  - `src/themes/css-vars.ts`: `themeToCssVars(theme: Theme): Record<\`--${string}\`, string>`.
  - `src/themes/ThemeScope.tsx` (client): `ThemeContext`, `useTheme(): Theme`, `<ThemeScope name className? ...divProps>`.
  - `src/lib/cn.ts`: `cn(...classes: (string | false | null | undefined)[]): string`.
  - `src/fonts/index.ts`: `pretendard` (next/font/local, CSS 변수 `--font-pretendard`).
  - Tailwind 유틸리티: 색 `bg-bg text-fg bg-surface text-muted bg-accent text-accent-fg border-border`, 글꼴 `font-sans font-display font-mono`, 크기 `text-display text-h1 text-h2 text-body text-caption`, `leading-tight leading-normal tracking-tight`, 간격 `p-canvas`, `gap-s1`…`gap-s6`(`p-s4` 등 spacing 전체), `rounded-theme`, 변형 `portrait:`.

- [ ] **Step 1: 폰트 파일 가져오기**

```bash
SCRATCH=$(mktemp -d)
npm pack pretendard@1.3.9 --pack-destination "$SCRATCH"
tar -xzf "$SCRATCH"/pretendard-1.3.9.tgz -C "$SCRATCH"
mkdir -p src/fonts
cp "$SCRATCH"/package/dist/web/variable/woff2/PretendardVariable.woff2 src/fonts/
curl -fsSL https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE -o src/fonts/LICENSE-Pretendard.txt
head -3 src/fonts/LICENSE-Pretendard.txt
ls -la src/fonts
```
Expected: `PretendardVariable.woff2`(약 2.1MB), LICENSE 첫 줄에 Copyright/OFL 문구.

`src/fonts/fonts.json`:
```json
[
  {
    "family": "Pretendard",
    "version": "1.3.9",
    "file": "PretendardVariable.woff2",
    "license": "OFL-1.1",
    "licenseFile": "LICENSE-Pretendard.txt"
  }
]
```

`src/fonts/index.ts`:
```ts
import localFont from "next/font/local";

export const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});
```

- [ ] **Step 2: 실패하는 테스트 작성**

`tests/unit/themes.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { isThemeName, themeNames, themes } from "@/themes";
import { CONTRAST_PAIRS, MIN_CONTRAST, contrastRatio, parseHex } from "@/themes/contrast";
import { themeToCssVars } from "@/themes/css-vars";
import { CANVASES, COLOR_TOKENS, TYPE_STEPS } from "@/themes/types";

describe("contrastRatio", () => {
  it("검정/흰색은 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });
  it("같은 색은 1:1", () => {
    expect(contrastRatio("#3366CC", "#3366CC")).toBeCloseTo(1, 5);
  });
  it("인자 순서와 무관하다", () => {
    expect(contrastRatio("#FFFFFF", "#777777")).toBeCloseTo(contrastRatio("#777777", "#FFFFFF"), 10);
  });
  it("#777777 on 흰색 ≈ 4.48", () => {
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
  it("#rrggbb가 아니면 예외", () => {
    expect(() => parseHex("#fff")).toThrow();
    expect(() => parseHex("red")).toThrow();
  });
});

describe("themes", () => {
  it("이름 가드", () => {
    expect(isThemeName("paper")).toBe(true);
    expect(isThemeName("nope")).toBe(false);
    expect(themeNames).toEqual(["paper", "ink", "signal"]);
  });

  describe.each(themeNames)("%s", (name) => {
    const theme = themes[name];

    it.each(CONTRAST_PAIRS)("%s / %s 대비가 기준 이상", (fg, bg) => {
      expect(contrastRatio(theme.color[fg], theme.color[bg])).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    it("모든 색이 #rrggbb 형식", () => {
      for (const token of COLOR_TOKENS) expect(theme.color[token]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("두 캔버스 모두 타입 스케일이 양수이고 큰 것부터 작은 순서", () => {
      for (const canvas of CANVASES) {
        const sizes = TYPE_STEPS.map((step) => theme.type[canvas][step]);
        for (const size of sizes) expect(size).toBeGreaterThan(0);
        expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
      }
    });

    it("gap 스케일은 6단계 오름차순", () => {
      expect(theme.space.gap).toHaveLength(6);
      expect([...theme.space.gap].sort((a, b) => a - b)).toEqual([...theme.space.gap]);
    });
  });
});

describe("themeToCssVars", () => {
  const vars = themeToCssVars(themes.paper);

  it("캔버스별 타입 크기를 px로 낸다", () => {
    expect(vars["--t-h1-l"]).toBe("96px");
    expect(vars["--t-h1-p"]).toBe("84px");
    expect(vars["--t-pad-l"]).toBe("120px");
    expect(vars["--t-pad-p"]).toBe("96px");
  });

  it("색·간격·라운드를 낸다", () => {
    expect(vars["--t-accent-fg"]).toBe(themes.paper.color.accentFg);
    expect(vars["--t-gap-1"]).toBe("8px");
    expect(vars["--t-gap-6"]).toBe("96px");
    expect(vars["--t-radius"]).toBe("24px");
  });

  it("빈 값이 없다", () => {
    for (const value of Object.values(vars)) expect(value).not.toMatch(/undefined|NaN/);
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npx vitest run tests/unit/themes.test.ts`
Expected: FAIL — `Failed to resolve import "@/themes"`.

- [ ] **Step 4: 테마 구현**

`src/lib/cn.ts`:
```ts
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
```

`src/themes/types.ts`:
```ts
export const CANVASES = ["landscape", "portrait"] as const;
export type Canvas = (typeof CANVASES)[number];

export const TYPE_STEPS = ["display", "h1", "h2", "body", "caption"] as const;
export type TypeStep = (typeof TYPE_STEPS)[number];

export const COLOR_TOKENS = ["bg", "surface", "fg", "muted", "accent", "accentFg", "border"] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export type Bezier = [number, number, number, number];

export type Theme = {
  label: string;
  color: Record<ColorToken, string>;
  font: { sans: string; display: string; mono: string };
  /** 논리 px (캔버스 좌표계) */
  type: Record<Canvas, Record<TypeStep, number>>;
  leading: { tight: number; normal: number };
  tracking: { tight: string };
  space: {
    /** 슬라이드 안쪽 여백, 논리 px */
    pad: Record<Canvas, number>;
    /** gap-s1 … gap-s6, 논리 px */
    gap: readonly [number, number, number, number, number, number];
  };
  radius: number;
  motion: {
    /** 초 단위 */
    duration: { fast: number; base: number; slow: number };
    easing: { standard: Bezier; emphasized: Bezier };
  };
};
```

`src/themes/base.ts`:
```ts
import type { Theme } from "./types";

const SANS =
  'var(--font-pretendard), "Pretendard Variable", Pretendard, system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "D2Coding", monospace';

/** 색을 제외한 공통 토큰. 각 테마는 색과 이름만 정한다. */
export const baseTokens: Omit<Theme, "label" | "color"> = {
  font: { sans: SANS, display: SANS, mono: MONO },
  type: {
    landscape: { display: 144, h1: 96, h2: 64, body: 40, caption: 28 },
    portrait: { display: 120, h1: 84, h2: 60, body: 40, caption: 30 },
  },
  leading: { tight: 1.15, normal: 1.5 },
  tracking: { tight: "-0.02em" },
  space: {
    pad: { landscape: 120, portrait: 96 },
    gap: [8, 16, 24, 40, 64, 96],
  },
  radius: 24,
  motion: {
    duration: { fast: 0.18, base: 0.35, slow: 0.7 },
    easing: { standard: [0.2, 0, 0, 1], emphasized: [0.05, 0.7, 0.1, 1] },
  },
};
```

`src/themes/paper.ts`:
```ts
import { baseTokens } from "./base";
import type { Theme } from "./types";

export const paper: Theme = {
  ...baseTokens,
  label: "Paper",
  color: {
    bg: "#FAFAF7",
    surface: "#FFFFFF",
    fg: "#1A1A1A",
    muted: "#5C5C5C",
    accent: "#2F5BEA",
    accentFg: "#FFFFFF",
    border: "#E2E2DC",
  },
};
```

`src/themes/ink.ts`:
```ts
import { baseTokens } from "./base";
import type { Theme } from "./types";

export const ink: Theme = {
  ...baseTokens,
  label: "Ink",
  color: {
    bg: "#0F1115",
    surface: "#1A1D24",
    fg: "#F2F2F0",
    muted: "#A3A7B0",
    accent: "#7AA2FF",
    accentFg: "#0F1115",
    border: "#2A2E37",
  },
};
```

`src/themes/signal.ts`:
```ts
import { baseTokens } from "./base";
import type { Theme } from "./types";

export const signal: Theme = {
  ...baseTokens,
  label: "Signal",
  color: {
    bg: "#B8321C",
    surface: "#A02B17",
    fg: "#FFFFFF",
    muted: "#FFE3DC",
    accent: "#1A1A1A",
    accentFg: "#FFFFFF",
    border: "#D9563F",
  },
};
```

`src/themes/contrast.ts`:
```ts
import type { ColorToken } from "./types";

export const MIN_CONTRAST = 4.5;

/** 테스트로 강제하고 갤러리에서 표시하는 글자/배경 조합 */
export const CONTRAST_PAIRS: readonly (readonly [ColorToken, ColorToken])[] = [
  ["fg", "bg"],
  ["muted", "bg"],
  ["fg", "surface"],
  ["accentFg", "accent"],
];

export function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`#rrggbb 형식이 아닙니다: ${hex}`);
  const n = Number.parseInt(match[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
```

`src/themes/css-vars.ts`:
```ts
import { CANVASES, TYPE_STEPS, type Theme } from "./types";

type CssVars = Record<`--${string}`, string>;

const SUFFIX = { landscape: "l", portrait: "p" } as const;

/** 테마 토큰 → CSS 변수. 캔버스별 값은 -l/-p 접미사로 내고 globals.css가 data-canvas에 따라 고른다. */
export function themeToCssVars(theme: Theme): CssVars {
  const vars: CssVars = {
    "--t-bg": theme.color.bg,
    "--t-surface": theme.color.surface,
    "--t-fg": theme.color.fg,
    "--t-muted": theme.color.muted,
    "--t-accent": theme.color.accent,
    "--t-accent-fg": theme.color.accentFg,
    "--t-border": theme.color.border,
    "--t-font-sans": theme.font.sans,
    "--t-font-display": theme.font.display,
    "--t-font-mono": theme.font.mono,
    "--t-leading-tight": String(theme.leading.tight),
    "--t-leading-normal": String(theme.leading.normal),
    "--t-tracking-tight": theme.tracking.tight,
    "--t-radius": `${theme.radius}px`,
  };
  for (const canvas of CANVASES) {
    const suffix = SUFFIX[canvas];
    for (const step of TYPE_STEPS) vars[`--t-${step}-${suffix}`] = `${theme.type[canvas][step]}px`;
    vars[`--t-pad-${suffix}`] = `${theme.space.pad[canvas]}px`;
  }
  theme.space.gap.forEach((gap, i) => {
    vars[`--t-gap-${i + 1}`] = `${gap}px`;
  });
  return vars;
}
```

`src/themes/index.ts`:
```ts
import { ink } from "./ink";
import { paper } from "./paper";
import { signal } from "./signal";
import type { Theme } from "./types";

export const themes = { paper, ink, signal } satisfies Record<string, Theme>;
export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

export function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(themes, value);
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run tests/unit/themes.test.ts`
Expected: PASS (전부).

- [ ] **Step 6: ThemeScope와 CSS 연결**

`src/themes/ThemeScope.tsx`:
```tsx
"use client";

import { createContext, useContext, type CSSProperties, type HTMLAttributes } from "react";
import { themeToCssVars } from "./css-vars";
import { themes, type ThemeName } from "./index";
import type { Theme } from "./types";

export const ThemeContext = createContext<Theme>(themes.paper);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

type ThemeScopeProps = HTMLAttributes<HTMLDivElement> & { name: ThemeName };

/** 하위 트리에 테마 CSS 변수와 Theme 컨텍스트를 제공한다. */
export function ThemeScope({ name, style, children, ...rest }: ThemeScopeProps) {
  const theme = themes[name];
  return (
    <ThemeContext value={theme}>
      <div data-theme={name} style={{ ...(themeToCssVars(theme) as CSSProperties), ...style }} {...rest}>
        {children}
      </div>
    </ThemeContext>
  );
}
```

`src/app/globals.css` (전체 교체):
```css
@import "tailwindcss";

/* portrait: = 슬라이드 캔버스가 4:5일 때 (뷰포트 방향이 아님). 내장 portrait 변형을 덮어쓴다. */
@custom-variant portrait (&:where([data-canvas="portrait"], [data-canvas="portrait"] *));

@theme inline {
  --color-bg: var(--t-bg);
  --color-surface: var(--t-surface);
  --color-fg: var(--t-fg);
  --color-muted: var(--t-muted);
  --color-accent: var(--t-accent);
  --color-accent-fg: var(--t-accent-fg);
  --color-border: var(--t-border);

  --font-sans: var(--t-font-sans);
  --font-display: var(--t-font-display);
  --font-mono: var(--t-font-mono);

  --text-display: var(--t-display);
  --text-display--line-height: var(--t-leading-tight);
  --text-h1: var(--t-h1);
  --text-h1--line-height: var(--t-leading-tight);
  --text-h2: var(--t-h2);
  --text-h2--line-height: var(--t-leading-tight);
  --text-body: var(--t-body);
  --text-body--line-height: var(--t-leading-normal);
  --text-caption: var(--t-caption);
  --text-caption--line-height: var(--t-leading-normal);

  --leading-tight: var(--t-leading-tight);
  --leading-normal: var(--t-leading-normal);
  --tracking-tight: var(--t-tracking-tight);

  --spacing-canvas: var(--t-pad);
  --spacing-s1: var(--t-gap-1);
  --spacing-s2: var(--t-gap-2);
  --spacing-s3: var(--t-gap-3);
  --spacing-s4: var(--t-gap-4);
  --spacing-s5: var(--t-gap-5);
  --spacing-s6: var(--t-gap-6);

  --radius-theme: var(--t-radius);
}

@layer base {
  [data-theme] {
    font-family: var(--t-font-sans);
  }

  [data-canvas="landscape"] {
    --t-display: var(--t-display-l);
    --t-h1: var(--t-h1-l);
    --t-h2: var(--t-h2-l);
    --t-body: var(--t-body-l);
    --t-caption: var(--t-caption-l);
    --t-pad: var(--t-pad-l);
  }

  [data-canvas="portrait"] {
    --t-display: var(--t-display-p);
    --t-h1: var(--t-h1-p);
    --t-h2: var(--t-h2-p);
    --t-body: var(--t-body-p);
    --t-caption: var(--t-caption-p);
    --t-pad: var(--t-pad-p);
  }

  /* 슬라이드 기본값. base 레이어라서 작성자의 유틸리티 클래스가 항상 이긴다. */
  [data-slide-index] {
    padding: var(--t-pad);
    background-color: var(--t-bg);
    color: var(--t-fg);
    font-size: var(--t-body);
    line-height: var(--t-leading-normal);
  }
}

@media print {
  @page {
    size: 1920px 1080px;
    margin: 0;
  }
  html,
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}

.print-page {
  break-after: page;
}
```

`src/app/layout.tsx` (전체 교체):
```tsx
import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { pretendard } from "@/fonts";
import { themes } from "@/themes";
import { themeToCssVars } from "@/themes/css-vars";
import { SITE_DESCRIPTION, SITE_TITLE } from "../../site.config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // paper 변수를 루트 기본값으로 둔다. ThemeScope가 하위 트리에서 덮어쓴다.
  return (
    <html lang="ko" className={pretendard.variable} style={themeToCssVars(themes.paper) as CSSProperties}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: 빌드로 CSS 매핑 확인**

임시로 `src/app/page.tsx`의 `<h1>`에 `className="text-h1 bg-surface p-s4 portrait:flex-col rounded-theme"`를 붙이고:

Run: `npm run build && grep -oE '\.text-h1\{[^}]*\}|\.p-s4\{[^}]*\}|portrait\\:flex-col[^{]*\{[^}]*\}' out/_next/static/chunks/*.css`
Expected: `.text-h1{font-size:var(--t-h1);line-height:...}`, `.p-s4{padding:var(--t-gap-4)}` 류와 `portrait\:flex-col:where([data-canvas=portrait]...` 출력. 확인 후 className을 원래대로 되돌린다.

- [ ] **Step 8: 전체 검사 후 커밋**

Run: `npm run check`
Expected: 통과.

```bash
git add -A
git commit -m "feat: add theme tokens, contrast checks, CSS variable mapping and self-hosted Pretendard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 슬라이드 엔진 순수 로직

**Files:**
- Create: `src/engine/canvas.ts`, `src/engine/navigation.ts`, `src/engine/steps.ts`, `src/engine/mode.ts`, `src/engine/input.ts`, `src/engine/effects.ts`, `src/engine/read.ts`
- Test: `tests/unit/canvas.test.ts`, `tests/unit/navigation.test.ts`, `tests/unit/steps.test.ts`, `tests/unit/mode.test.ts`, `tests/unit/input.test.ts`, `tests/unit/effects.test.ts`, `tests/unit/read.test.ts`

**Interfaces:**
- Consumes: `Canvas` from `@/themes/types`.
- Produces:
  - `canvas.ts`: `type Size = { width: number; height: number }`, `CANVAS_SIZE: Record<Canvas, Size>`, `type StageAspect = "16:9" | "4:5" | "1:1"`, `STAGE_SIZE: Record<StageAspect, Size>`, `type Fit = "contain" | "width"`, `fitScale(box: Size, canvas: Size, fit: Fit): number`, `type OverflowMetrics`, `isOverflowing(m: OverflowMetrics, tolerance?: number): boolean`, `type Rect = { top; left; bottom; right }`, `isOutside(child: Rect, root: Rect, tolerance?: number): boolean`.
  - `navigation.ts`: `type DeckPosition = { slide: number; step: number }` (0-based slide, step = 공개된 스텝 수), `type NavAction`, `clampSlide(i, count)`, `navigate(pos, action, stepCounts: readonly number[]): DeckPosition`, `parseHash(hash: string, count: number): number`, `formatHash(index: number): string`.
  - `steps.ts`: `resolveStepOrders(explicit: readonly (number | undefined)[]): { orders: number[]; count: number }`, `parseOrder(raw: string | undefined): number | undefined`.
  - `mode.ts`: `type ViewMode = "present" | "read"`, `type DeckMode = ViewMode | "print"`, `parseModeParam(search: string): ViewMode | null`, `resolveMode(input: { search: string; portraitViewport: boolean; override: ViewMode | null }): { mode: DeckMode; canvas: Canvas }`.
  - `input.ts`: `type KeyInput = { key; code; shiftKey; ctrlKey; metaKey; altKey }`, `type Command = "next" | "prev" | "first" | "last" | "fullscreen" | "mode" | "help" | "close"`, `keyToCommand(e: KeyInput): Command | null`, `type StageCommand = "toggle" | "restart"`, `stageKeyToCommand(e: KeyInput): StageCommand | null`, `SWIPE_MIN = 50`, `type Gesture`, `gestureToCommand(g: Gesture): "next" | "prev" | null`.
  - `effects.ts`: `type StepEffect = "fade" | "rise" | "scale"`, `STEP_VARIANTS: Record<StepEffect, Variants>`, `type SlideTransition = "fade" | "slide" | "none"`, `SLIDE_SHIFT = 96`, `slideAnimation(transition, offset): { opacity: number; x: number }`.
  - `read.ts`: `pickCurrent(ratios: ReadonlyMap<number, number>, min?: number): number | null`.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/canvas.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { CANVAS_SIZE, STAGE_SIZE, fitScale, isOutside, isOverflowing } from "@/engine/canvas";

describe("CANVAS_SIZE", () => {
  it("landscape 1920×1080, portrait 1080×1350", () => {
    expect(CANVAS_SIZE.landscape).toEqual({ width: 1920, height: 1080 });
    expect(CANVAS_SIZE.portrait).toEqual({ width: 1080, height: 1350 });
    expect(STAGE_SIZE["1:1"]).toEqual({ width: 1080, height: 1080 });
  });
});

describe("fitScale", () => {
  const canvas = { width: 1920, height: 1080 };
  it("contain은 가로·세로 중 작은 비율", () => {
    expect(fitScale({ width: 960, height: 1000 }, canvas, "contain")).toBeCloseTo(0.5);
    expect(fitScale({ width: 3840, height: 540 }, canvas, "contain")).toBeCloseTo(0.5);
  });
  it("width는 가로 비율만", () => {
    expect(fitScale({ width: 390, height: 10 }, { width: 1080, height: 1350 }, "width")).toBeCloseTo(390 / 1080);
  });
  it("아직 측정 전(0)이면 0", () => {
    expect(fitScale({ width: 0, height: 0 }, canvas, "contain")).toBe(0);
    expect(fitScale({ width: 0, height: 500 }, canvas, "width")).toBe(0);
  });
});

describe("isOverflowing", () => {
  it("스크롤 크기가 클라이언트 크기를 넘으면 true", () => {
    expect(isOverflowing({ scrollWidth: 1920, scrollHeight: 1200, clientWidth: 1920, clientHeight: 1080 })).toBe(true);
    expect(isOverflowing({ scrollWidth: 2000, scrollHeight: 1080, clientWidth: 1920, clientHeight: 1080 })).toBe(true);
  });
  it("1px 이하 오차는 무시", () => {
    expect(isOverflowing({ scrollWidth: 1921, scrollHeight: 1081, clientWidth: 1920, clientHeight: 1080 })).toBe(false);
  });
});

describe("isOutside", () => {
  const root = { top: 0, left: 0, bottom: 1080, right: 1920 };
  it("위로 넘친 요소도 잡는다 (scrollHeight로는 안 잡히는 경우)", () => {
    expect(isOutside({ top: -40, left: 100, bottom: 200, right: 800 }, root)).toBe(true);
  });
  it("안쪽 요소는 false", () => {
    expect(isOutside({ top: 120, left: 120, bottom: 960, right: 1800 }, root)).toBe(false);
  });
});
```

`tests/unit/navigation.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { clampSlide, formatHash, navigate, parseHash } from "@/engine/navigation";

const counts = [0, 3, 0, 1]; // 슬라이드별 스텝 수

describe("navigate", () => {
  it("next: 스텝이 남아 있으면 스텝부터", () => {
    expect(navigate({ slide: 1, step: 0 }, { type: "next" }, counts)).toEqual({ slide: 1, step: 1 });
    expect(navigate({ slide: 1, step: 3 }, { type: "next" }, counts)).toEqual({ slide: 2, step: 0 });
  });
  it("next: 마지막 슬라이드의 마지막 스텝이면 그대로", () => {
    const end = { slide: 3, step: 1 };
    expect(navigate(end, { type: "next" }, counts)).toBe(end);
  });
  it("prev: 스텝을 되돌리고, 0이면 이전 슬라이드를 모두 펼친 상태로", () => {
    expect(navigate({ slide: 1, step: 2 }, { type: "prev" }, counts)).toEqual({ slide: 1, step: 1 });
    expect(navigate({ slide: 2, step: 0 }, { type: "prev" }, counts)).toEqual({ slide: 1, step: 3 });
  });
  it("prev: 첫 슬라이드 처음이면 그대로", () => {
    const start = { slide: 0, step: 0 };
    expect(navigate(start, { type: "prev" }, counts)).toBe(start);
  });
  it("first / last", () => {
    expect(navigate({ slide: 2, step: 0 }, { type: "first" }, counts)).toEqual({ slide: 0, step: 0 });
    expect(navigate({ slide: 0, step: 0 }, { type: "last" }, counts)).toEqual({ slide: 3, step: 1 });
  });
  it("goto: 범위를 보정하고 스텝은 0", () => {
    expect(navigate({ slide: 0, step: 0 }, { type: "goto", slide: 99 }, counts)).toEqual({ slide: 3, step: 0 });
    expect(navigate({ slide: 2, step: 0 }, { type: "goto", slide: -5 }, counts)).toEqual({ slide: 0, step: 0 });
  });
  it("goto: 같은 슬라이드면 현재 스텝 유지", () => {
    const pos = { slide: 1, step: 2 };
    expect(navigate(pos, { type: "goto", slide: 1 }, counts)).toBe(pos);
  });
  it("슬라이드가 0장이면 0,0", () => {
    expect(navigate({ slide: 0, step: 0 }, { type: "next" }, [])).toEqual({ slide: 0, step: 0 });
  });
});

describe("hash", () => {
  it("1부터 세는 번호를 0부터 세는 인덱스로", () => {
    expect(parseHash("#1", 4)).toBe(0);
    expect(parseHash("#3", 4)).toBe(2);
    expect(parseHash("3", 4)).toBe(2);
  });
  it("범위 밖은 보정", () => {
    expect(parseHash("#99", 4)).toBe(3);
    expect(parseHash("#0", 4)).toBe(0);
  });
  it("숫자가 아니면 0", () => {
    expect(parseHash("", 4)).toBe(0);
    expect(parseHash("#abc", 4)).toBe(0);
    expect(parseHash("#2.5", 4)).toBe(0);
    expect(parseHash("#-2", 4)).toBe(0);
  });
  it("formatHash", () => {
    expect(formatHash(0)).toBe("#1");
    expect(formatHash(6)).toBe("#7");
  });
  it("clampSlide", () => {
    expect(clampSlide(5, 3)).toBe(2);
    expect(clampSlide(-1, 3)).toBe(0);
    expect(clampSlide(0, 0)).toBe(0);
  });
});
```

`tests/unit/steps.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseOrder, resolveStepOrders } from "@/engine/steps";

describe("resolveStepOrders", () => {
  it("order가 없으면 문서 순서대로 1, 2, 3", () => {
    expect(resolveStepOrders([undefined, undefined, undefined])).toEqual({ orders: [1, 2, 3], count: 3 });
  });
  it("명시한 order를 따른다", () => {
    expect(resolveStepOrders([2, 1])).toEqual({ orders: [2, 1], count: 2 });
  });
  it("같은 order는 함께 등장", () => {
    expect(resolveStepOrders([1, 1, 2])).toEqual({ orders: [1, 1, 2], count: 2 });
  });
  it("빈 번호는 압축해서 헛클릭이 없다", () => {
    expect(resolveStepOrders([5, undefined, undefined])).toEqual({ orders: [3, 1, 2], count: 3 });
    expect(resolveStepOrders([10, 10])).toEqual({ orders: [1, 1], count: 1 });
  });
  it("스텝이 없으면 count 0", () => {
    expect(resolveStepOrders([])).toEqual({ orders: [], count: 0 });
  });
});

describe("parseOrder", () => {
  it("양의 정수만 인정", () => {
    expect(parseOrder("2")).toBe(2);
    expect(parseOrder(undefined)).toBeUndefined();
    expect(parseOrder("")).toBeUndefined();
    expect(parseOrder("0")).toBeUndefined();
    expect(parseOrder("1.5")).toBeUndefined();
    expect(parseOrder("abc")).toBeUndefined();
  });
});
```

`tests/unit/mode.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseModeParam, resolveMode } from "@/engine/mode";

describe("parseModeParam", () => {
  it("present/read만 인정", () => {
    expect(parseModeParam("?mode=read")).toBe("read");
    expect(parseModeParam("?mode=present")).toBe("present");
    expect(parseModeParam("?mode=print")).toBeNull();
    expect(parseModeParam("")).toBeNull();
  });
});

describe("resolveMode", () => {
  it("가로 뷰포트는 발표 모드 + landscape", () => {
    expect(resolveMode({ search: "", portraitViewport: false, override: null })).toEqual({ mode: "present", canvas: "landscape" });
  });
  it("세로 뷰포트는 읽기 모드 + portrait", () => {
    expect(resolveMode({ search: "", portraitViewport: true, override: null })).toEqual({ mode: "read", canvas: "portrait" });
  });
  it("수동 지정이 자동보다 우선", () => {
    expect(resolveMode({ search: "", portraitViewport: true, override: "present" })).toEqual({ mode: "present", canvas: "landscape" });
    expect(resolveMode({ search: "", portraitViewport: false, override: "read" })).toEqual({ mode: "read", canvas: "landscape" });
  });
  it("?print가 모든 것보다 우선, canvas 파라미터로 portrait 검사", () => {
    expect(resolveMode({ search: "?print", portraitViewport: true, override: "read" })).toEqual({ mode: "print", canvas: "landscape" });
    expect(resolveMode({ search: "?print&canvas=portrait", portraitViewport: false, override: null })).toEqual({ mode: "print", canvas: "portrait" });
  });
});
```

`tests/unit/input.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { gestureToCommand, keyToCommand, stageKeyToCommand, type KeyInput } from "@/engine/input";

const key = (k: string, extra: Partial<KeyInput> = {}): KeyInput => ({
  key: k,
  code: "",
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...extra,
});

describe("keyToCommand", () => {
  it.each([
    ["ArrowRight", "next"],
    ["ArrowDown", "next"],
    ["PageDown", "next"],
    [" ", "next"],
    ["ArrowLeft", "prev"],
    ["ArrowUp", "prev"],
    ["PageUp", "prev"],
    ["Home", "first"],
    ["End", "last"],
    ["?", "help"],
    ["Escape", "close"],
  ])("%s → %s", (k, command) => {
    expect(keyToCommand(key(k))).toBe(command);
  });
  it("Shift+Space는 이전", () => {
    expect(keyToCommand(key(" ", { shiftKey: true }))).toBe("prev");
  });
  it("글자 키는 물리 키(code)로 판단 — 한글 입력 상태에서도 동작", () => {
    expect(keyToCommand(key("f", { code: "KeyF" }))).toBe("fullscreen");
    expect(keyToCommand(key("ㄹ", { code: "KeyF" }))).toBe("fullscreen");
    expect(keyToCommand(key("ㅡ", { code: "KeyM" }))).toBe("mode");
  });
  it("수정 키와 함께면 무시 (브라우저 단축키 보호)", () => {
    expect(keyToCommand(key("ArrowRight", { metaKey: true }))).toBeNull();
    expect(keyToCommand(key("f", { code: "KeyF", ctrlKey: true }))).toBeNull();
  });
  it("모르는 키는 null", () => {
    expect(keyToCommand(key("a", { code: "KeyA" }))).toBeNull();
  });
});

describe("stageKeyToCommand", () => {
  it("Space는 토글, R은 다시 재생 (한글 입력 포함)", () => {
    expect(stageKeyToCommand(key(" ", { code: "Space" }))).toBe("toggle");
    expect(stageKeyToCommand(key("r", { code: "KeyR" }))).toBe("restart");
    expect(stageKeyToCommand(key("ㄱ", { code: "KeyR" }))).toBe("restart");
    expect(stageKeyToCommand(key("x", { code: "KeyX" }))).toBeNull();
  });
});

describe("gestureToCommand", () => {
  const base = { downX: 500, downY: 300, width: 1000 };
  it("왼쪽으로 스와이프하면 다음", () => {
    expect(gestureToCommand({ ...base, upX: 400, upY: 310 })).toBe("next");
  });
  it("오른쪽으로 스와이프하면 이전", () => {
    expect(gestureToCommand({ ...base, upX: 600, upY: 290 })).toBe("prev");
  });
  it("탭은 화면 절반 기준", () => {
    expect(gestureToCommand({ downX: 800, downY: 300, upX: 802, upY: 301, width: 1000 })).toBe("next");
    expect(gestureToCommand({ downX: 200, downY: 300, upX: 199, upY: 300, width: 1000 })).toBe("prev");
  });
  it("세로 스와이프는 무시", () => {
    expect(gestureToCommand({ ...base, upX: 510, upY: 120 })).toBeNull();
  });
});
```

`tests/unit/effects.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { SLIDE_SHIFT, STEP_VARIANTS, slideAnimation } from "@/engine/effects";

describe("slideAnimation", () => {
  it("현재 슬라이드는 보이고 제자리", () => {
    expect(slideAnimation("fade", 0)).toEqual({ opacity: 1, x: 0 });
    expect(slideAnimation("slide", 0)).toEqual({ opacity: 1, x: 0 });
  });
  it("fade/none은 이동 없이 투명", () => {
    expect(slideAnimation("fade", 2)).toEqual({ opacity: 0, x: 0 });
    expect(slideAnimation("none", -1)).toEqual({ opacity: 0, x: 0 });
  });
  it("slide는 방향에 따라 좌우로 밀린다", () => {
    expect(slideAnimation("slide", -1)).toEqual({ opacity: 0, x: -SLIDE_SHIFT });
    expect(slideAnimation("slide", 3)).toEqual({ opacity: 0, x: SLIDE_SHIFT });
  });
});

describe("STEP_VARIANTS", () => {
  it("세 효과 모두 hidden/shown을 가진다", () => {
    for (const effect of ["fade", "rise", "scale"] as const) {
      expect(STEP_VARIANTS[effect]).toHaveProperty("hidden");
      expect(STEP_VARIANTS[effect]).toHaveProperty("shown");
    }
  });
});
```

`tests/unit/read.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { pickCurrent } from "@/engine/read";

describe("pickCurrent", () => {
  it("가장 많이 보이는 카드를 고른다", () => {
    expect(pickCurrent(new Map([[1, 0.4], [2, 1], [3, 0.6]]))).toBe(2);
  });
  it("동률이면 앞 카드", () => {
    expect(pickCurrent(new Map([[3, 0.8], [2, 0.8]]))).toBe(2);
  });
  it("모두 기준 미만이면 null (현재 값 유지)", () => {
    expect(pickCurrent(new Map([[0, 0.1], [1, 0.2]]))).toBeNull();
  });
  it("비어 있으면 null", () => {
    expect(pickCurrent(new Map())).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run tests/unit/canvas.test.ts tests/unit/navigation.test.ts tests/unit/steps.test.ts tests/unit/mode.test.ts tests/unit/input.test.ts tests/unit/effects.test.ts tests/unit/read.test.ts`
Expected: FAIL — `Failed to resolve import "@/engine/..."`.

- [ ] **Step 3: 구현**

`src/engine/canvas.ts`:
```ts
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
```

`src/engine/navigation.ts`:
```ts
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
```

`src/engine/steps.ts`:
```ts
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
```

`src/engine/mode.ts`:
```ts
import type { Canvas } from "@/themes/types";

export type ViewMode = "present" | "read";
export type DeckMode = ViewMode | "print";

export function parseModeParam(search: string): ViewMode | null {
  const value = new URLSearchParams(search).get("mode");
  return value === "present" || value === "read" ? value : null;
}

/**
 * 우선순위: ?print > 수동 지정(M 키, ?mode=) > 뷰포트 방향.
 * 발표 모드는 항상 landscape, 읽기 모드는 뷰포트 방향을 따른다.
 */
export function resolveMode(input: {
  search: string;
  portraitViewport: boolean;
  override: ViewMode | null;
}): { mode: DeckMode; canvas: Canvas } {
  const params = new URLSearchParams(input.search);
  if (params.has("print")) {
    return { mode: "print", canvas: params.get("canvas") === "portrait" ? "portrait" : "landscape" };
  }
  const mode = input.override ?? (input.portraitViewport ? "read" : "present");
  if (mode === "present") return { mode, canvas: "landscape" };
  return { mode, canvas: input.portraitViewport ? "portrait" : "landscape" };
}
```

`src/engine/input.ts`:
```ts
export type KeyInput = {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type Command = "next" | "prev" | "first" | "last" | "fullscreen" | "mode" | "help" | "close";

/** 글자 단축키는 key가 아닌 code로 판단한다 — 한글 입력 상태에서는 key가 'ㄹ' 등이 되기 때문. */
export function keyToCommand(e: KeyInput): Command | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
    case "PageDown":
      return "next";
    case " ":
      return e.shiftKey ? "prev" : "next";
    case "ArrowLeft":
    case "ArrowUp":
    case "PageUp":
      return "prev";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "?":
      return "help";
    case "Escape":
      return "close";
  }
  switch (e.code) {
    case "KeyF":
      return "fullscreen";
    case "KeyM":
      return "mode";
    case "Slash":
      return e.shiftKey ? "help" : null;
  }
  return null;
}

export type StageCommand = "toggle" | "restart";

export function stageKeyToCommand(e: KeyInput): StageCommand | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === " " || e.code === "Space") return "toggle";
  if (e.code === "KeyR") return "restart";
  return null;
}

export const SWIPE_MIN = 50;

export type Gesture = { downX: number; downY: number; upX: number; upY: number; width: number };

/** 가로 스와이프 → 다음/이전, 탭 → 화면 좌/우 절반, 세로 스와이프 → 무시. */
export function gestureToCommand(g: Gesture): "next" | "prev" | null {
  const dx = g.upX - g.downX;
  const dy = g.upY - g.downY;
  if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "next" : "prev";
  if (Math.abs(dy) >= SWIPE_MIN) return null;
  return g.upX < g.width / 2 ? "prev" : "next";
}
```

`src/engine/effects.ts`:
```ts
import type { Variants } from "motion/react";

export type StepEffect = "fade" | "rise" | "scale";

export const STEP_VARIANTS: Record<StepEffect, Variants> = {
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  rise: { hidden: { opacity: 0, y: 40 }, shown: { opacity: 1, y: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.92 }, shown: { opacity: 1, scale: 1 } },
};

export type SlideTransition = "fade" | "slide" | "none";

export const SLIDE_SHIFT = 96;

/** offset = 슬라이드 인덱스 − 현재 인덱스 */
export function slideAnimation(transition: SlideTransition, offset: number): { opacity: number; x: number } {
  const opacity = offset === 0 ? 1 : 0;
  if (transition !== "slide" || offset === 0) return { opacity, x: 0 };
  return { opacity, x: offset < 0 ? -SLIDE_SHIFT : SLIDE_SHIFT };
}
```

`src/engine/read.ts`:
```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run`
Expected: PASS (모든 단위 테스트).

- [ ] **Step 5: 커밋**

```bash
npm run check
git add -A
git commit -m "feat(engine): add pure navigation, step ordering, mode, input and canvas logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 작업물 레지스트리 타입·조회·검증

**Files:**
- Create: `src/works/types.ts`, `src/works/query.ts`, `src/works/validate.ts`
- Test: `tests/unit/works.test.ts`

**Interfaces:**
- Consumes: `ThemeName` from `@/themes`.
- Produces:
  - `types.ts`: `type WorkKind = "deck" | "motion"`, `type Work = { kind; slug; title; description; date; theme: ThemeName; draft?: boolean; load: () => Promise<{ default: ComponentType }> }`.
  - `query.ts`: `isDevBuild(): boolean`, `workKey(kind, slug): string`, `listWorks(works, opts: { kind?: WorkKind; includeDrafts: boolean }): Work[]` (날짜 내림차순, 같으면 slug 오름차순), `findWork(works, kind, slug): Work | undefined`, `workHref(work): string` (예: `/decks/hello/`, basePath 제외), `contentPath(kind, slug): string` (예: `content/decks/hello/index.tsx`).
  - `validate.ts`: `validateWorks(works, deps: { themeNames: readonly string[]; fileExists: (path: string) => boolean }): string[]` — 오류 메시지 배열(비면 정상).

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/works.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { contentPath, findWork, listWorks, workHref, workKey } from "@/works/query";
import type { Work } from "@/works/types";
import { validateWorks } from "@/works/validate";

const load = async () => ({ default: () => null });

const make = (over: Partial<Work>): Work => ({
  kind: "deck",
  slug: "a",
  title: "제목",
  description: "설명",
  date: "2026-10-01",
  theme: "paper",
  load,
  ...over,
});

const sample: Work[] = [
  make({ slug: "old", date: "2026-01-01" }),
  make({ slug: "new", date: "2026-10-01" }),
  make({ slug: "wip", date: "2026-12-01", draft: true }),
  make({ kind: "motion", slug: "intro", date: "2026-05-05", theme: "signal" }),
];

describe("query", () => {
  it("listWorks: draft 제외, 최신순", () => {
    expect(listWorks(sample, { includeDrafts: false }).map((w) => w.slug)).toEqual(["new", "intro", "old"]);
  });
  it("listWorks: dev에서는 draft 포함", () => {
    expect(listWorks(sample, { includeDrafts: true }).map((w) => w.slug)).toEqual(["wip", "new", "intro", "old"]);
  });
  it("listWorks: 종류 필터", () => {
    expect(listWorks(sample, { kind: "motion", includeDrafts: false }).map((w) => w.slug)).toEqual(["intro"]);
  });
  it("findWork는 종류와 slug로 찾는다", () => {
    expect(findWork(sample, "motion", "intro")?.theme).toBe("signal");
    expect(findWork(sample, "deck", "intro")).toBeUndefined();
  });
  it("경로 헬퍼", () => {
    expect(workHref(make({ slug: "hello" }))).toBe("/decks/hello/");
    expect(workHref(make({ kind: "motion", slug: "m" }))).toBe("/motion/m/");
    expect(contentPath("deck", "hello")).toBe("content/decks/hello/index.tsx");
    expect(contentPath("motion", "m")).toBe("content/motion/m/index.tsx");
    expect(workKey("deck", "hello")).toBe("deck/hello");
  });
});

describe("validateWorks", () => {
  const deps = { themeNames: ["paper", "ink", "signal"], fileExists: () => true };
  const valid = [make({ slug: "hello" }), make({ kind: "motion", slug: "m" })];

  it("정상 레지스트리는 오류 없음", () => {
    expect(validateWorks(valid, deps)).toEqual([]);
  });
  it("slug 형식", () => {
    const errors = validateWorks([...valid, make({ slug: "Bad Slug" })], deps);
    expect(errors.join("\n")).toContain("Bad Slug");
  });
  it("같은 종류 안에서 slug 중복", () => {
    const errors = validateWorks([...valid, make({ slug: "hello" })], deps);
    expect(errors.join("\n")).toContain("중복");
  });
  it("날짜 형식과 실재 날짜", () => {
    expect(validateWorks([...valid, make({ slug: "x", date: "2026/10/01" })], deps)).toHaveLength(1);
    expect(validateWorks([...valid, make({ slug: "y", date: "2026-02-30" })], deps)).toHaveLength(1);
  });
  it("없는 테마", () => {
    const errors = validateWorks([...valid, make({ slug: "z", theme: "neon" as Work["theme"] })], deps);
    expect(errors.join("\n")).toContain("neon");
  });
  it("빈 제목·설명", () => {
    expect(validateWorks([...valid, make({ slug: "t", title: " " })], deps)).toHaveLength(1);
    expect(validateWorks([...valid, make({ slug: "d", description: "" })], deps)).toHaveLength(1);
  });
  it("콘텐츠 파일이 없으면 경로를 알려준다", () => {
    const errors = validateWorks(valid, { ...deps, fileExists: (p) => !p.includes("hello") });
    expect(errors).toEqual([expect.stringContaining("content/decks/hello/index.tsx")]);
  });
  it("종류별 공개 작업물이 0개면 Next export 제약을 설명한다", () => {
    const allDraft = [make({ slug: "hello", draft: true }), make({ kind: "motion", slug: "m" })];
    const errors = validateWorks(allDraft, deps);
    expect(errors).toEqual([expect.stringContaining("공개된 deck")]);
    expect(errors[0]).toContain("generateStaticParams");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run tests/unit/works.test.ts`
Expected: FAIL — `Failed to resolve import "@/works/query"`.

- [ ] **Step 3: 구현**

`src/works/types.ts`:
```ts
import type { ComponentType } from "react";
import type { ThemeName } from "@/themes";

export type WorkKind = "deck" | "motion";

export type Work = {
  kind: WorkKind;
  /** URL 세그먼트. 소문자·숫자·하이픈. 같은 kind 안에서 고유. */
  slug: string;
  title: string;
  /** 목록과 링크 미리보기(OG)에 쓰인다 */
  description: string;
  /** YYYY-MM-DD */
  date: string;
  theme: ThemeName;
  /** true면 개발 모드에서만 보이고 프로덕션 빌드에서 제외 */
  draft?: boolean;
  load: () => Promise<{ default: ComponentType }>;
};
```

`src/works/query.ts`:
```ts
import type { Work, WorkKind } from "./types";

const DIR: Record<WorkKind, string> = { deck: "decks", motion: "motion" };

export function isDevBuild(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function workKey(kind: WorkKind, slug: string): string {
  return `${kind}/${slug}`;
}

export function listWorks(
  works: readonly Work[],
  opts: { kind?: WorkKind; includeDrafts: boolean },
): Work[] {
  return works
    .filter((w) => (opts.kind ? w.kind === opts.kind : true))
    .filter((w) => opts.includeDrafts || !w.draft)
    .toSorted((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function findWork(works: readonly Work[], kind: WorkKind, slug: string): Work | undefined {
  return works.find((w) => w.kind === kind && w.slug === slug);
}

/** basePath를 뺀 경로. next/link가 basePath를 붙인다. */
export function workHref(work: Pick<Work, "kind" | "slug">): string {
  return `/${DIR[work.kind]}/${work.slug}/`;
}

export function contentPath(kind: WorkKind, slug: string): string {
  return `content/${DIR[kind]}/${slug}/index.tsx`;
}
```

`src/works/validate.ts`:
```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/works.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
npm run check
git add -A
git commit -m "feat(works): add work registry types, queries and validation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 로컬 정적 서버(serve-out)와 Playwright 설정

**Files:**
- Create: `scripts/lib/serve.ts`, `scripts/serve-out.ts`, `playwright.config.ts`, `tests/e2e/helpers.ts`, `tests/e2e/site.spec.ts`
- Test: `tests/unit/serve.test.ts`

**Interfaces:**
- Consumes: `BASE_PATH` from `site.config.ts`.
- Produces:
  - `scripts/lib/serve.ts`: `type ServeOptions = { root: string; basePath: string; port: number; host?: string }`, `type RunningServer = { url: string; close: () => Promise<void> }` (`url` 예: `http://127.0.0.1:4173/public-posts/`), `resolveRequestPath(root, basePath, urlPath): string | null`, `startServer(opts): Promise<RunningServer>`.
  - CLI: `npm run preview` / `npx tsx scripts/serve-out.ts --port 4173`.
  - `tests/e2e/helpers.ts`: `sitePath(p: string): string` (예: `sitePath("/decks/hello/")` → `/public-posts/decks/hello/`).
  - Playwright 프로젝트 `desktop`(1440×900)과 `mobile`(390×844, `mobile.spec.ts`만).

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/serve.test.ts`:
```ts
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveRequestPath, startServer, type RunningServer } from "../../scripts/lib/serve";

const BASE = "/public-posts";
const root = mkdtempSync(join(tmpdir(), "serve-out-"));
mkdirSync(join(root, "decks/hello"), { recursive: true });
writeFileSync(join(root, "index.html"), "<p>home</p>");
writeFileSync(join(root, "404.html"), "<p>missing</p>");
writeFileSync(join(root, "decks/hello/index.html"), "<p>deck</p>");
writeFileSync(join(root, "decks/hello.pdf"), "%PDF-1.7");

describe("resolveRequestPath", () => {
  it("basePath 밖은 null", () => {
    expect(resolveRequestPath(root, BASE, "/other/")).toBeNull();
  });
  it("basePath와 비슷한 접두어는 거부", () => {
    expect(resolveRequestPath(root, BASE, "/public-postsX/index.html")).toBeNull();
  });
  it("슬래시로 끝나면 index.html, 쿼리·해시는 무시", () => {
    expect(resolveRequestPath(root, BASE, "/public-posts/decks/hello/?print#3")).toBe(join(root, "decks/hello/index.html"));
    expect(resolveRequestPath(root, BASE, "/public-posts")).toBe(join(root, "index.html"));
  });
  it("상위 디렉터리로 나가지 못한다", () => {
    const resolved = resolveRequestPath(root, BASE, "/public-posts/../../etc/passwd");
    expect(resolved === null || resolved.startsWith(root)).toBe(true);
  });
  it("깨진 퍼센트 인코딩은 null", () => {
    expect(resolveRequestPath(root, BASE, "/public-posts/%E0%A4%A")).toBeNull();
  });
});

describe("startServer", () => {
  let server: RunningServer;
  beforeAll(async () => {
    server = await startServer({ root, basePath: BASE, port: 0 });
  });
  afterAll(async () => {
    await server.close();
  });

  it("url은 basePath로 끝난다", () => {
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/public-posts\/$/);
  });
  it("index.html을 HTML로 서빙", async () => {
    const res = await fetch(server.url);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("home");
  });
  it("디렉터리는 슬래시를 붙여 308, 쿼리 유지", async () => {
    const res = await fetch(new URL("decks/hello?print", server.url), { redirect: "manual" });
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("/public-posts/decks/hello/?print");
  });
  it("PDF는 application/pdf", async () => {
    const res = await fetch(new URL("decks/hello.pdf", server.url));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });
  it("없는 파일은 404.html 내용과 404", async () => {
    const res = await fetch(new URL("decks/nope/", server.url));
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("missing");
  });
  it("깨진 URL에도 죽지 않고 404", async () => {
    const res = await fetch(`${server.url}%E0%A4%A`);
    expect(res.status).toBe(404);
    const again = await fetch(server.url);
    expect(again.status).toBe(200);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run tests/unit/serve.test.ts`
Expected: FAIL — `Failed to resolve import "../../scripts/lib/serve"`.

- [ ] **Step 3: 구현**

`scripts/lib/serve.ts`:
```ts
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export type ServeOptions = { root: string; basePath: string; port: number; host?: string };
export type RunningServer = { url: string; close: () => Promise<void> };

function splitUrl(urlPath: string): { pathname: string; search: string } {
  const noHash = urlPath.split("#")[0] ?? "";
  const q = noHash.indexOf("?");
  return q < 0 ? { pathname: noHash, search: "" } : { pathname: noHash.slice(0, q), search: noHash.slice(q) };
}

/** GitHub Pages처럼 basePath 아래만 서빙한다. 루트 밖으로 나가는 경로와 해석 불가 URL은 null. */
export function resolveRequestPath(root: string, basePath: string, urlPath: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(splitUrl(urlPath).pathname);
  } catch {
    return null;
  }
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return null;
  let rel = pathname.slice(basePath.length) || "/";
  if (rel.endsWith("/")) rel += "index.html";
  const rootAbs = resolve(root);
  const abs = resolve(rootAbs, `.${normalize(rel)}`);
  if (abs !== rootAbs && !abs.startsWith(rootAbs + sep)) return null;
  return abs;
}

export function startServer({ root, basePath, port, host = "127.0.0.1" }: ServeOptions): Promise<RunningServer> {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = req.url ?? "/";
      const file = resolveRequestPath(root, basePath, urlPath);
      if (file) {
        const info = await stat(file).catch(() => null);
        if (info?.isDirectory()) {
          const { pathname, search } = splitUrl(urlPath);
          res.writeHead(308, { Location: `${pathname}/${search}` });
          res.end();
          return;
        }
        if (info?.isFile()) {
          res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
          res.end(await readFile(file));
          return;
        }
      }
      const body = await readFile(join(root, "404.html")).catch(() => Buffer.from("Not Found"));
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end();
    }
  });

  return new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      ok({
        url: `http://${host}:${actualPort}${basePath}/`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}
```

`scripts/serve-out.ts`:
```ts
import { BASE_PATH } from "../site.config";
import { startServer } from "./lib/serve";

async function main() {
  const flag = process.argv.indexOf("--port");
  const port = flag >= 0 ? Number(process.argv[flag + 1]) : 4173;
  const server = await startServer({ root: "out", basePath: BASE_PATH, port });
  console.log(`out/ 을 ${server.url} 에서 서빙합니다 (Ctrl+C로 종료)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/serve.test.ts`
Expected: PASS.

- [ ] **Step 5: Playwright 설정과 첫 E2E**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";
import { BASE_PATH } from "./site.config";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx tsx scripts/serve-out.ts --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
});
```

`tests/e2e/helpers.ts`:
```ts
import { BASE_PATH } from "../../site.config";

export function sitePath(path: string): string {
  return `${BASE_PATH}/${path.replace(/^\//, "")}`;
}
```

`tests/e2e/site.spec.ts` (이 Task에서는 홈 렌더만 확인. Task 7에서 확장):
```ts
import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

test("홈이 basePath 아래에서 열린다", async ({ page }) => {
  const res = await page.goto(sitePath("/"));
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "public-posts" })).toBeVisible();
});
```

- [ ] **Step 6: Chromium 설치 후 E2E 실행**

```bash
npx playwright install --with-deps chromium
```
WSL/Linux에서 sudo 권한이 없어 OS 의존성 설치가 실패하면 `npx playwright install chromium` 후 출력되는 `sudo npx playwright install-deps chromium` 안내를 따른다.

Run: `npm run build && npm run e2e`
Expected: `1 passed` (desktop 프로젝트).

- [ ] **Step 7: 커밋**

```bash
npm run check
git add -A
git commit -m "feat: add basePath-aware static server and Playwright setup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 슬라이드 엔진 컴포넌트

이 Task는 React 컴포넌트·훅이다. 동작은 Task 7의 E2E로 검증하므로 여기서는 타입체크·린트·빌드가 게이트다. 각 파일의 코드는 그대로 작성한다.

**Files:**
- Create: `src/engine/slide-context.ts`, `src/engine/dom.ts`, `src/engine/ScaledCanvas.tsx`, `src/engine/Slide.tsx`, `src/engine/Step.tsx`, `src/engine/useDeckKeys.ts`, `src/engine/useHashSync.ts`, `src/engine/useDeckEnvironment.ts`, `src/engine/HelpOverlay.tsx`, `src/engine/indicators.tsx`, `src/engine/PresentView.tsx`, `src/engine/ReadView.tsx`, `src/engine/PrintView.tsx`, `src/engine/Deck.tsx`, `src/engine/MotionStage.tsx`, `src/engine/StaticSlideFrame.tsx`, `src/engine/index.ts`

**Interfaces:**
- Consumes: Task 2 (`ThemeContext`, `useTheme`, `ThemeScope`, `themes`, `themeToCssVars`, `cn`), Task 3 (전부).
- Produces (콘텐츠 작성자용 공개 API, `@/engine`):
  - `<Deck transition?: "fade" | "slide" | "none">` — **직접 자식 하나 = 슬라이드 하나**.
  - `<Slide theme?: ThemeName className?>` — 루트에 `data-slide-index`(1부터), `data-active`, `data-canvas`, 인쇄 모드에서 `data-overflow`.
  - `<Step order?: number effect?: "fade" | "rise" | "scale" className?>` — `data-step`, `data-visible`.
  - `<MotionStage aspect?: "16:9" | "4:5" | "1:1" loop?: boolean sequence: (theme: Theme) => AnimationSequence className?>` — 루트에 `data-motion-stage`, `data-playing`.
  - `<StaticSlideFrame canvas theme>` — 덱 밖(갤러리)에서 슬라이드 1장을 그린다.
  - DOM 계약: 덱 루트 `[data-deck][data-mode="present|read|print"]`, 읽기 모드 카드 `[data-card="<0부터>"]`, 인쇄 준비 완료 시 `<html data-ready="true">`, 도움말 `role="dialog"`.

- [ ] **Step 1: 컨텍스트와 DOM 유틸**

`src/engine/slide-context.ts`:
```ts
"use client";

import { createContext, useContext } from "react";
import type { Canvas } from "@/themes/types";

export type SlideSlot = {
  /** 0부터 */
  index: number;
  canvas: Canvas;
  /** 공개된 Step 수 (order ≤ revealed 인 Step이 보임) */
  revealed: number;
  /** 읽기·인쇄 모드: 모든 Step 표시 */
  showAll: boolean;
  /** 발표 모드에서 현재 슬라이드인지 (다른 모드는 항상 true) */
  active: boolean;
  reportSteps: (index: number, count: number) => void;
};

const noop = () => {};

export const DEFAULT_SLOT: SlideSlot = {
  index: 0,
  canvas: "landscape",
  revealed: Number.POSITIVE_INFINITY,
  showAll: true,
  active: true,
  reportSteps: noop,
};

export const SlideSlotContext = createContext<SlideSlot>(DEFAULT_SLOT);

export function useSlideSlot(): SlideSlot {
  return useContext(SlideSlotContext);
}

/** Step id(useId) → 등장 순서 */
export type StepOrders = Readonly<Record<string, number>>;

export const StepOrderContext = createContext<StepOrders>({});
```

`src/engine/dom.ts`:
```ts
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
```

- [ ] **Step 2: ScaledCanvas, Slide, Step**

`src/engine/ScaledCanvas.tsx`:
```tsx
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
```

`src/engine/Slide.tsx`:
```tsx
"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { themeToCssVars } from "@/themes/css-vars";
import { themes, type ThemeName } from "@/themes";
import { ThemeContext } from "@/themes/ThemeScope";
import { StepOrderContext, useSlideSlot, type StepOrders } from "./slide-context";
import { parseOrder, resolveStepOrders } from "./steps";

export type SlideProps = {
  children: ReactNode;
  /** 이 슬라이드만 다른 테마로 (예: 섹션 구분 슬라이드를 ink로) */
  theme?: ThemeName;
  className?: string;
};

export function Slide({ children, theme, className }: SlideProps) {
  const { index, canvas, active, reportSteps } = useSlideSlot();
  const ref = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<StepOrders>({});

  // 마운트 시 1회: 문서 순서대로 Step을 모아 등장 순서를 정하고 덱에 개수를 알린다.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const resolved = resolveStepOrders(steps.map((el) => parseOrder(el.dataset.order)));
    setOrders(Object.fromEntries(steps.map((el, i) => [el.dataset.step ?? "", resolved.orders[i] ?? 0])));
    reportSteps(index, resolved.count);
  }, [index, reportSteps]);

  const content = (
    <div
      ref={ref}
      data-slide-index={index + 1}
      data-active={active}
      data-canvas={canvas}
      data-theme={theme}
      style={theme ? (themeToCssVars(themes[theme]) as CSSProperties) : undefined}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <StepOrderContext value={orders}>{children}</StepOrderContext>
    </div>
  );

  return theme ? <ThemeContext value={themes[theme]}>{content}</ThemeContext> : content;
}
```

`src/engine/Step.tsx`:
```tsx
"use client";

import { motion } from "motion/react";
import { useContext, useId, type ReactNode } from "react";
import { useTheme } from "@/themes/ThemeScope";
import { STEP_VARIANTS, type StepEffect } from "./effects";
import { StepOrderContext, useSlideSlot } from "./slide-context";

export type StepProps = {
  children: ReactNode;
  /** 생략하면 문서 순서. 같은 값이면 함께 등장. */
  order?: number;
  effect?: StepEffect;
  className?: string;
};

export function Step({ children, order, effect = "fade", className }: StepProps) {
  const id = useId();
  const slot = useSlideSlot();
  const orders = useContext(StepOrderContext);
  const theme = useTheme();
  const resolved = orders[id];
  const visible = slot.showAll || (resolved !== undefined && resolved <= slot.revealed);

  return (
    <motion.div
      data-step={id}
      data-order={order}
      data-visible={visible}
      className={className}
      initial={false}
      variants={STEP_VARIANTS[effect]}
      animate={visible ? "shown" : "hidden"}
      transition={{ duration: theme.motion.duration.base, ease: theme.motion.easing.emphasized }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: 훅**

`src/engine/useDeckKeys.ts`:
```ts
"use client";

import { useEffect, useEffectEvent } from "react";
import { isEditableTarget } from "./dom";
import { keyToCommand, type Command } from "./input";

export function useDeckKeys(onCommand: (command: Command) => void): void {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return;
    const command = keyToCommand(event);
    if (!command) return;
    event.preventDefault();
    onCommand(command);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handle(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
```

`src/engine/useHashSync.ts`:
```ts
"use client";

import { useEffect, useEffectEvent } from "react";
import { formatHash, parseHash } from "./navigation";

/** 현재 슬라이드를 주소 해시(#1부터)에 쓰고, 사용자가 해시를 바꾸면 알려준다. 기록(history)은 쌓지 않는다. */
export function useHashSync(current: number, count: number, onExternalChange: (index: number) => void): void {
  useEffect(() => {
    const next = formatHash(current);
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [current]);

  const onHash = useEffectEvent(() => onExternalChange(parseHash(window.location.hash, count)));

  useEffect(() => {
    const listener = () => onHash();
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
}
```

`src/engine/useDeckEnvironment.ts`:
```ts
"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { Canvas } from "@/themes/types";
import { parseModeParam, resolveMode, type DeckMode, type ViewMode } from "./mode";

const PORTRAIT_QUERY = "(orientation: portrait)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getPortrait = () => window.matchMedia(PORTRAIT_QUERY).matches;

/** 클라이언트 전용(작업물 페이지는 ssr:false로 렌더된다). */
export function useDeckEnvironment(): { mode: DeckMode; canvas: Canvas; toggleMode: () => void } {
  const portraitViewport = useSyncExternalStore(subscribe, getPortrait, () => false);
  const [search] = useState(() => window.location.search);
  const [override, setOverride] = useState<ViewMode | null>(() => parseModeParam(search));
  const { mode, canvas } = resolveMode({ search, portraitViewport, override });
  const toggleMode = useCallback(() => setOverride(mode === "present" ? "read" : "present"), [mode]);
  return { mode, canvas, toggleMode };
}
```

- [ ] **Step 4: 오버레이와 인디케이터**

`src/engine/HelpOverlay.tsx`:
```tsx
"use client";

const SHORTCUTS: [string, string][] = [
  ["→ · Space · PgDn · 오른쪽 탭", "다음"],
  ["← · Shift+Space · PgUp · 왼쪽 탭", "이전"],
  ["Home / End", "처음 / 끝"],
  ["F", "전체화면"],
  ["M", "발표 ↔ 읽기 모드"],
  ["?", "이 도움말"],
];

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="단축키"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="max-w-md rounded-xl bg-white p-6 text-neutral-900 shadow-xl">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="contents">
              <dt className="font-mono text-neutral-600">{keys}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-neutral-500">아무 키나 누르거나 화면을 누르면 닫힙니다</p>
      </div>
    </div>
  );
}
```

`src/engine/indicators.tsx`:
```tsx
"use client";

import { cn } from "@/lib/cn";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label="슬라이드 진행"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-1 bg-fg/10"
    >
      <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** 이 개수를 넘으면 점 대신 "n / N" */
export const MAX_DOTS = 12;

export function ReadIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-3 z-10 flex justify-center">
      <div className="flex items-center gap-1.5 rounded-full bg-fg/70 px-3 py-1.5 text-xs text-bg">
        {total <= MAX_DOTS ? (
          Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("size-1.5 rounded-full", i === current ? "bg-bg" : "bg-bg/40")} />
          ))
        ) : (
          <span>
            {current + 1} / {total}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 세 가지 뷰**

`src/engine/PresentView.tsx`:
```tsx
"use client";

import { motion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/themes/ThemeScope";
import { CANVAS_SIZE } from "./canvas";
import { isInteractiveTarget, toggleFullscreen } from "./dom";
import { slideAnimation, type SlideTransition } from "./effects";
import { HelpOverlay } from "./HelpOverlay";
import { ProgressBar } from "./indicators";
import { gestureToCommand } from "./input";
import { navigate, parseHash, type DeckPosition, type NavAction } from "./navigation";
import { ScaledCanvas } from "./ScaledCanvas";
import { SlideSlotContext } from "./slide-context";
import { useDeckKeys } from "./useDeckKeys";
import { useHashSync } from "./useHashSync";

type PresentViewProps = {
  slides: ReactNode[];
  stepCounts: readonly number[];
  reportSteps: (index: number, count: number) => void;
  transition: SlideTransition;
  onToggleMode: () => void;
};

/**
 * 모든 슬라이드를 마운트해 둔 채(스텝 개수 측정에 필요) 현재 슬라이드만 보이게 애니메이션한다.
 */
export function PresentView({ slides, stepCounts, reportSteps, transition, onToggleMode }: PresentViewProps) {
  const theme = useTheme();
  const [pos, setPos] = useState<DeckPosition>(() => ({ slide: parseHash(window.location.hash, slides.length), step: 0 }));
  const [helpOpen, setHelpOpen] = useState(false);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const go = (action: NavAction) => setPos((current) => navigate(current, action, stepCounts));

  useHashSync(pos.slide, slides.length, (slide) => go({ type: "goto", slide }));

  useDeckKeys((command) => {
    if (helpOpen) {
      setHelpOpen(false);
      return;
    }
    switch (command) {
      case "next":
      case "prev":
      case "first":
      case "last":
        go({ type: command });
        return;
      case "fullscreen":
        toggleFullscreen();
        return;
      case "mode":
        onToggleMode();
        return;
      case "help":
        setHelpOpen(true);
        return;
      case "close":
        return;
    }
  });

  return (
    <div
      className="fixed inset-0 touch-pinch-zoom overflow-hidden select-none"
      onPointerDown={(event) => {
        pointer.current = event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
      }}
      onPointerUp={(event) => {
        const start = pointer.current;
        pointer.current = null;
        if (!start || helpOpen || isInteractiveTarget(event.target)) return;
        const command = gestureToCommand({
          downX: start.x,
          downY: start.y,
          upX: event.clientX,
          upY: event.clientY,
          width: window.innerWidth,
        });
        if (command) go({ type: command });
      }}
    >
      <ScaledCanvas size={CANVAS_SIZE.landscape} fit="contain">
        {slides.map((slide, i) => {
          const offset = i - pos.slide;
          const active = offset === 0;
          return (
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={false}
              animate={slideAnimation(transition, offset)}
              transition={{
                duration: transition === "none" ? 0 : theme.motion.duration.base,
                ease: theme.motion.easing.standard,
              }}
              style={{ zIndex: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}
              aria-hidden={!active}
              inert={!active}
            >
              <SlideSlotContext
                value={{
                  index: i,
                  canvas: "landscape",
                  revealed: active ? pos.step : offset < 0 ? Number.POSITIVE_INFINITY : 0,
                  showAll: false,
                  active,
                  reportSteps,
                }}
              >
                {slide}
              </SlideSlotContext>
            </motion.div>
          );
        })}
      </ScaledCanvas>
      <ProgressBar current={pos.slide} total={slides.length} />
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
```

`src/engine/ReadView.tsx`:
```tsx
"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/themes/ThemeScope";
import type { Canvas } from "@/themes/types";
import { CANVAS_SIZE } from "./canvas";
import { toggleFullscreen } from "./dom";
import { HelpOverlay } from "./HelpOverlay";
import { ReadIndicator } from "./indicators";
import { clampSlide, parseHash } from "./navigation";
import { pickCurrent } from "./read";
import { ScaledCanvas } from "./ScaledCanvas";
import { SlideSlotContext } from "./slide-context";
import { useDeckKeys } from "./useDeckKeys";
import { useHashSync } from "./useHashSync";

type ReadViewProps = {
  slides: ReactNode[];
  canvas: Canvas;
  reportSteps: (index: number, count: number) => void;
  onToggleMode: () => void;
};

export function ReadView({ slides, canvas, reportSteps, onToggleMode }: ReadViewProps) {
  const theme = useTheme();
  const [current, setCurrent] = useState(() => parseHash(window.location.hash, slides.length));
  const [helpOpen, setHelpOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const initial = useRef(current);
  // 첫 위치로 이동하기 전에는 '현재 카드' 추적을 멈춘다 (안 그러면 맨 위 카드가 해시를 덮어쓴다).
  const settled = useRef(false);

  const scrollToCard = (index: number) =>
    cards.current[clampSlide(index, slides.length)]?.scrollIntoView({ behavior: "smooth", block: "start" });

  // 딥링크(#n): 카드 높이는 ScaledCanvas가 측정한 뒤에야 정해지므로, 크기가 생긴 첫 시점에 한 번만 이동한다.
  useEffect(() => {
    const container = list.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const target = cards.current[initial.current];
      if (!target || target.offsetHeight === 0) return;
      target.scrollIntoView({ behavior: "instant", block: "start" });
      settled.current = true;
      observer.disconnect();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(Number((entry.target as HTMLElement).dataset.card), entry.intersectionRatio);
        if (!settled.current) return;
        const best = pickCurrent(ratios);
        if (best !== null) setCurrent(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const card of cards.current) if (card) observer.observe(card);
    return () => observer.disconnect();
  }, [slides.length]);

  useHashSync(current, slides.length, (index) => {
    setCurrent(index);
    scrollToCard(index);
  });

  useDeckKeys((command) => {
    if (helpOpen) {
      setHelpOpen(false);
      return;
    }
    switch (command) {
      case "next":
        scrollToCard(current + 1);
        return;
      case "prev":
        scrollToCard(current - 1);
        return;
      case "first":
        scrollToCard(0);
        return;
      case "last":
        scrollToCard(slides.length - 1);
        return;
      case "fullscreen":
        toggleFullscreen();
        return;
      case "mode":
        onToggleMode();
        return;
      case "help":
        setHelpOpen(true);
        return;
      case "close":
        return;
    }
  });

  const size = CANVAS_SIZE[canvas];

  return (
    <div className="fixed inset-0 snap-y snap-proximity overflow-y-auto">
      <div
        ref={list}
        className={cn("mx-auto flex w-full flex-col gap-4 px-3 py-4", canvas === "portrait" ? "max-w-[560px]" : "max-w-[1200px]")}
      >
        {slides.map((slide, i) => (
          <motion.div
            key={i}
            ref={(el) => {
              cards.current[i] = el;
            }}
            data-card={i}
            className="snap-start overflow-hidden rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: theme.motion.duration.base, ease: theme.motion.easing.standard }}
          >
            <ScaledCanvas size={size} fit="width">
              <SlideSlotContext
                value={{ index: i, canvas, revealed: Number.POSITIVE_INFINITY, showAll: true, active: true, reportSteps }}
              >
                {slide}
              </SlideSlotContext>
            </ScaledCanvas>
          </motion.div>
        ))}
      </div>
      <ReadIndicator current={current} total={slides.length} />
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
```

`src/engine/PrintView.tsx`:
```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Canvas } from "@/themes/types";
import { CANVAS_SIZE } from "./canvas";
import { nextFrame, slideOverflows } from "./dom";
import { SlideSlotContext } from "./slide-context";

type PrintViewProps = {
  slides: ReactNode[];
  canvas: Canvas;
  reportSteps: (index: number, count: number) => void;
};

/**
 * 모든 슬라이드를 논리 크기 그대로(배율 1) 세로로 나열한다. 폰트·이미지가 준비되면
 * 슬라이드별 data-overflow를 기록하고 <html data-ready="true">로 PDF 스크립트에 알린다.
 */
export function PrintView({ slides, canvas, reportSteps }: PrintViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const size = CANVAS_SIZE[canvas];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (img) => img.decode().catch(() => undefined)));
      await nextFrame();
      await nextFrame();
      if (cancelled || !root.current) return;
      for (const slide of root.current.querySelectorAll<HTMLElement>("[data-slide-index]")) {
        slide.dataset.overflow = String(slideOverflows(slide));
      }
      document.documentElement.dataset.ready = "true";
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={root} data-print-root>
      {slides.map((slide, i) => (
        <div key={i} className="print-page relative overflow-hidden" style={{ width: size.width, height: size.height }}>
          <SlideSlotContext
            value={{ index: i, canvas, revealed: Number.POSITIVE_INFINITY, showAll: true, active: true, reportSteps }}
          >
            {slide}
          </SlideSlotContext>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Deck, MotionStage, StaticSlideFrame, 공개 API**

`src/engine/Deck.tsx`:
```tsx
"use client";

import { Children, useCallback, useState, type ReactNode } from "react";
import type { SlideTransition } from "./effects";
import { PresentView } from "./PresentView";
import { PrintView } from "./PrintView";
import { ReadView } from "./ReadView";
import { useDeckEnvironment } from "./useDeckEnvironment";

export type DeckProps = {
  /** 직접 자식 하나가 슬라이드 하나다. */
  children: ReactNode;
  transition?: SlideTransition;
};

export function Deck({ children, transition = "fade" }: DeckProps) {
  const slides = Children.toArray(children);
  const { mode, canvas, toggleMode } = useDeckEnvironment();
  const [stepCounts, setStepCounts] = useState<number[]>(() => slides.map(() => 0));

  const reportSteps = useCallback((index: number, count: number) => {
    setStepCounts((prev) =>
      prev[index] === count ? prev : Array.from({ length: Math.max(prev.length, index + 1) }, (_, i) => (i === index ? count : prev[i] ?? 0)),
    );
  }, []);

  return (
    <div data-deck="" data-mode={mode}>
      {mode === "present" && (
        <PresentView
          slides={slides}
          stepCounts={stepCounts}
          reportSteps={reportSteps}
          transition={transition}
          onToggleMode={toggleMode}
        />
      )}
      {mode === "read" && <ReadView slides={slides} canvas={canvas} reportSteps={reportSteps} onToggleMode={toggleMode} />}
      {mode === "print" && <PrintView slides={slides} canvas={canvas} reportSteps={reportSteps} />}
    </div>
  );
}
```

`src/engine/MotionStage.tsx`:
```tsx
"use client";

import {
  useAnimate,
  useInView,
  useReducedMotion,
  type AnimationPlaybackControls,
  type AnimationSequence,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/themes/ThemeScope";
import type { Theme } from "@/themes/types";
import { STAGE_SIZE, type StageAspect } from "./canvas";
import { isEditableTarget } from "./dom";
import { stageKeyToCommand } from "./input";
import { ScaledCanvas } from "./ScaledCanvas";

export type MotionStageProps = {
  aspect?: StageAspect;
  loop?: boolean;
  /** 셀렉터는 스테이지 안에서만 찾는다. 다시 재생이 가능하도록 키프레임은 시작값부터 적는다 (예: opacity: [0, 1]). */
  sequence: (theme: Theme) => AnimationSequence;
  className?: string;
  children: ReactNode;
};

/**
 * 독립 모션 작품용 고정 캔버스. 화면에 보이면 재생, 클릭/Space로 일시정지·재개, R로 처음부터.
 * prefers-reduced-motion이면 재생하지 않고 최종 상태를 보여준다.
 */
export function MotionStage({ aspect = "16:9", loop = false, sequence, className, children }: MotionStageProps) {
  const theme = useTheme();
  const reduce = useReducedMotion() ?? false;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { amount: 0.5 });
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const playing = inView && !paused && !reduce;

  const create = useEffectEvent(() => {
    const repeat = loop && !reduce ? Number.POSITIVE_INFINITY : 0;
    const created = animate(sequence(theme), { repeat, repeatDelay: repeat ? 1 : 0 });
    created.pause();
    if (reduce) created.complete();
    return created;
  });

  useEffect(() => {
    const created = create();
    controls.current = created;
    return () => {
      created.stop();
      controls.current = null;
    };
  }, [run]);

  useEffect(() => {
    const current = controls.current;
    if (!current) return;
    if (playing) current.play();
    else current.pause();
  }, [playing, run]);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return;
    const command = stageKeyToCommand(event);
    if (!command) return;
    event.preventDefault();
    if (command === "toggle") {
      setPaused((p) => !p);
    } else {
      setPaused(false);
      setRun((r) => r + 1);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <div
      data-motion-stage=""
      data-playing={playing}
      className={cn("fixed inset-0 overflow-hidden bg-bg", className)}
      onClick={() => setPaused((p) => !p)}
    >
      <ScaledCanvas size={STAGE_SIZE[aspect]} fit="contain">
        <div
          ref={scope}
          data-canvas={aspect === "16:9" ? "landscape" : "portrait"}
          className="relative h-full w-full overflow-hidden bg-bg font-sans text-fg"
        >
          {children}
        </div>
      </ScaledCanvas>
    </div>
  );
}
```

`src/engine/StaticSlideFrame.tsx`:
```tsx
"use client";

import type { ReactNode } from "react";
import type { ThemeName } from "@/themes";
import { ThemeScope } from "@/themes/ThemeScope";
import type { Canvas } from "@/themes/types";
import { CANVAS_SIZE } from "./canvas";
import { ScaledCanvas } from "./ScaledCanvas";
import { DEFAULT_SLOT, SlideSlotContext } from "./slide-context";

/** 덱 밖에서 슬라이드 한 장을 가로폭에 맞춰 그린다 (테마 갤러리용). */
export function StaticSlideFrame({ canvas, theme, children }: { canvas: Canvas; theme: ThemeName; children: ReactNode }) {
  return (
    <ThemeScope name={theme}>
      <ScaledCanvas size={CANVAS_SIZE[canvas]} fit="width">
        <SlideSlotContext value={{ ...DEFAULT_SLOT, canvas }}>{children}</SlideSlotContext>
      </ScaledCanvas>
    </ThemeScope>
  );
}
```

`src/engine/index.ts`:
```ts
export { Deck, type DeckProps } from "./Deck";
export { MotionStage, type MotionStageProps } from "./MotionStage";
export { Slide, type SlideProps } from "./Slide";
export { StaticSlideFrame } from "./StaticSlideFrame";
export { Step, type StepProps } from "./Step";
export type { StageAspect } from "./canvas";
export type { SlideTransition, StepEffect } from "./effects";
```

- [ ] **Step 7: 검사**

Run: `npm run check && npm run build`
Expected: 통과. 린트가 `react-hooks/*` 규칙으로 특정 줄을 지적하면, 규칙 문서를 확인해 코드 구조로 해결한다. 구조로 해결할 수 없고 의도된 패턴(예: DOM 측정 후 setState)일 때만 해당 줄에 `// eslint-disable-next-line <rule> -- <이유>`를 단다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat(engine): add Deck with present/read/print views, Slide, Step and MotionStage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 작업물 페이지, 샘플 작업물, E2E

**Files:**
- Create: `content/registry.ts`, `content/decks/hello/index.tsx`, `content/motion/hello-motion/index.tsx`
- Create: `src/works/metadata.ts`, `src/works/WorkClient.tsx`, `src/works/WorkView.tsx`, `src/works/NoScript.tsx`
- Create: `src/app/decks/[slug]/page.tsx`, `src/app/motion/[slug]/page.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/page.tsx` (목록), `tests/e2e/site.spec.ts`
- Test: `tests/unit/registry.test.ts`, `tests/e2e/deck.spec.ts`, `tests/e2e/print.spec.ts`, `tests/e2e/mobile.spec.ts`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: Task 4 (`Work`, `listWorks`, `findWork`, `workHref`, `workKey`, `isDevBuild`, `validateWorks`, `contentPath`), Task 6 (`Deck`, `Slide`, `Step`, `MotionStage`), Task 2 (`ThemeScope`, `themeNames`).
- Produces: `content/registry.ts` → `export const works: Work[]`. `src/works/metadata.ts` → `workMetadata(work: Work): Metadata`. 샘플 덱 `hello`(4장, 2번 슬라이드에 Step 3개), 샘플 모션 `hello-motion`(클래스 `.hm-word`, `.hm-bar`, `.hm-caption`).

- [ ] **Step 1: 레지스트리 실물 검증 테스트 작성 (실패)**

`tests/unit/registry.test.ts`:
```ts
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { works } from "@content/registry";
import { themeNames } from "@/themes";
import { validateWorks } from "@/works/validate";

describe("content/registry.ts", () => {
  it("검증 오류가 없다", () => {
    expect(validateWorks(works, { themeNames, fileExists: (path) => existsSync(path) })).toEqual([]);
  });
});
```

Run: `npx vitest run tests/unit/registry.test.ts`
Expected: FAIL — `Failed to resolve import "@content/registry"`.

- [ ] **Step 2: 샘플 작업물과 레지스트리**

`content/decks/hello/index.tsx`:
```tsx
import { Deck, Slide, Step } from "@/engine";

const VIEWS: [string, string][] = [
  ["발표", "16:9 전체화면"],
  ["읽기", "모바일 세로 4:5"],
  ["PDF", "주소 끝에 .pdf"],
];

export default function HelloDeck() {
  return (
    <Deck>
      <Slide theme="signal" className="flex flex-col justify-end gap-s3">
        <p className="text-h2 font-bold text-muted">public-posts</p>
        <h1 className="font-display text-display font-extrabold tracking-tight">
          웹에서 만드는
          <br />
          발표 자료와 모션
        </h1>
      </Slide>

      <Slide className="flex flex-col gap-s5">
        <h2 className="text-h1 font-bold tracking-tight">이 덱을 넘기는 법</h2>
        <div className="flex flex-col gap-s3">
          <Step effect="rise">→ · Space · 화면 오른쪽: 다음</Step>
          <Step effect="rise">← · 화면 왼쪽: 이전</Step>
          <Step effect="rise">M 읽기 모드 · F 전체화면 · ? 도움말</Step>
        </div>
      </Slide>

      <Slide className="flex flex-row items-center gap-s6 portrait:flex-col portrait:items-start">
        <h2 className="w-1/2 text-h1 font-bold tracking-tight portrait:w-full">
          하나의 원본,
          <br />
          세 가지 보기
        </h2>
        <div className="flex w-1/2 flex-col gap-s3 portrait:w-full">
          {VIEWS.map(([name, detail]) => (
            <div key={name} className="rounded-theme border border-border bg-surface p-s4">
              <p className="text-caption text-muted">{name}</p>
              <p className="text-h2 font-bold">{detail}</p>
            </div>
          ))}
        </div>
      </Slide>

      <Slide theme="ink" className="flex flex-col items-center justify-center gap-s3 text-center">
        <h2 className="font-display text-display font-extrabold">끝</h2>
        <p className="text-muted">M 키로 읽기 모드 · ? 키로 도움말</p>
      </Slide>
    </Deck>
  );
}
```

`content/motion/hello-motion/index.tsx`:
```tsx
import { stagger, type AnimationSequence } from "motion/react";
import { MotionStage } from "@/engine";
import type { Theme } from "@/themes/types";

const WORDS = ["웹에서", "움직이는", "이야기"];

function sequence(theme: Theme): AnimationSequence {
  const ease = theme.motion.easing.emphasized;
  return [
    [".hm-word", { opacity: [0, 1], y: [60, 0] }, { duration: theme.motion.duration.slow, ease, delay: stagger(0.12) }],
    [".hm-bar", { scaleX: [0, 1] }, { duration: theme.motion.duration.slow, ease, at: "-0.2" }],
    [".hm-caption", { opacity: [0, 1] }, { duration: theme.motion.duration.base }],
  ];
}

export default function HelloMotion() {
  return (
    <MotionStage aspect="16:9" loop sequence={sequence}>
      <div className="flex h-full flex-col justify-center gap-s4 p-canvas">
        <h1 className="flex gap-s3 font-display text-display font-extrabold tracking-tight">
          {WORDS.map((word) => (
            <span key={word} className="hm-word inline-block opacity-0">
              {word}
            </span>
          ))}
        </h1>
        {/* Tailwind scale-x-* 클래스는 CSS scale 속성을 써서 Motion의 transform과 겹치므로 인라인으로 시작값을 둔다 */}
        <div className="hm-bar h-3 w-[60%] origin-left bg-fg" style={{ transform: "scaleX(0)" }} />
        <p className="hm-caption text-h2 text-muted opacity-0">public-posts · motion</p>
      </div>
    </MotionStage>
  );
}
```

`content/registry.ts`:
```ts
import type { Work } from "@/works/types";

/**
 * 작업물 목록의 단일 출처. 추가 = content/<decks|motion>/<slug>/index.tsx + 항목 1개.
 * 공개 작업물은 종류별 최소 1개가 필요하다 (tests/unit/registry.test.ts가 검사).
 */
export const works: Work[] = [
  {
    kind: "deck",
    slug: "hello",
    title: "public-posts 둘러보기",
    description: "발표·읽기·PDF로 보는 샘플 덱",
    date: "2026-10-05",
    theme: "paper",
    load: () => import("./decks/hello"),
  },
  {
    kind: "motion",
    slug: "hello-motion",
    title: "움직이는 인사",
    description: "타임라인 기반 샘플 모션",
    date: "2026-10-05",
    theme: "signal",
    load: () => import("./motion/hello-motion"),
  },
];
```

Run: `npx vitest run tests/unit/registry.test.ts`
Expected: PASS.

- [ ] **Step 3: 작업물 렌더링 레이어**

`src/works/metadata.ts`:
```ts
import type { Metadata } from "next";
import type { Work } from "./types";

export function workMetadata(work: Work): Metadata {
  return {
    title: work.title,
    description: work.description,
    openGraph: { title: work.title, description: work.description, type: "article" },
  };
}
```

`src/works/WorkView.tsx`:
```tsx
"use client";

import { MotionConfig } from "motion/react";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { works } from "@content/registry";
import { ThemeScope } from "@/themes/ThemeScope";
import { findWork, workKey } from "./query";
import type { WorkKind } from "./types";

// 작업물별 코드 분할: 각 작업물은 열릴 때만 로드된다.
const views: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  works.map((work) => [workKey(work.kind, work.slug), lazy(work.load)]),
);

export function WorkView({ kind, slug }: { kind: WorkKind; slug: string }) {
  const work = findWork(works, kind, slug);
  const View = views[workKey(kind, slug)];
  if (!work || !View) return null;
  return (
    <MotionConfig reducedMotion="user">
      <ThemeScope name={work.theme} className="min-h-dvh bg-bg text-fg">
        <Suspense fallback={null}>
          <View />
        </Suspense>
      </ThemeScope>
    </MotionConfig>
  );
}
```

`src/works/WorkClient.tsx`:
```tsx
"use client";

import dynamic from "next/dynamic";
import type { WorkKind } from "./types";

// 작업물은 뷰포트·URL에 따라 모드가 정해지므로 클라이언트에서만 렌더한다.
const WorkView = dynamic(() => import("./WorkView").then((m) => m.WorkView), { ssr: false });

export function WorkClient(props: { kind: WorkKind; slug: string }) {
  return <WorkView {...props} />;
}
```

`src/works/NoScript.tsx`:
```tsx
import type { Work } from "./types";

export function NoScript({ work }: { work: Work }) {
  return (
    <noscript>
      <div style={{ padding: 24 }}>
        <h1>{work.title}</h1>
        <p>{work.description}</p>
        <p>이 작업물을 보려면 JavaScript가 필요합니다.</p>
      </div>
    </noscript>
  );
}
```

- [ ] **Step 4: 라우트**

`src/app/decks/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { works } from "@content/registry";
import { workMetadata } from "@/works/metadata";
import { NoScript } from "@/works/NoScript";
import { findWork, isDevBuild, listWorks } from "@/works/query";
import { WorkClient } from "@/works/WorkClient";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listWorks(works, { kind: "deck", includeDrafts: isDevBuild() }).map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const work = findWork(works, "deck", (await params).slug);
  return work ? workMetadata(work) : {};
}

export default async function DeckPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const work = findWork(works, "deck", slug);
  if (!work) notFound();
  return (
    <>
      <WorkClient kind="deck" slug={slug} />
      <NoScript work={work} />
    </>
  );
}
```

`src/app/motion/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { works } from "@content/registry";
import { workMetadata } from "@/works/metadata";
import { NoScript } from "@/works/NoScript";
import { findWork, isDevBuild, listWorks } from "@/works/query";
import { WorkClient } from "@/works/WorkClient";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listWorks(works, { kind: "motion", includeDrafts: isDevBuild() }).map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const work = findWork(works, "motion", (await params).slug);
  return work ? workMetadata(work) : {};
}

export default async function MotionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const work = findWork(works, "motion", slug);
  if (!work) notFound();
  return (
    <>
      <WorkClient kind="motion" slug={slug} />
      <NoScript work={work} />
    </>
  );
}
```

`src/app/not-found.tsx`:
```tsx
import Link from "next/link";
import { ThemeScope } from "@/themes/ThemeScope";

export default function NotFound() {
  return (
    <ThemeScope name="paper" className="grid min-h-dvh place-items-center bg-bg p-6 text-fg">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <Link href="/" className="text-accent underline underline-offset-4">
          목록으로
        </Link>
      </div>
    </ThemeScope>
  );
}
```

`src/app/page.tsx` (전체 교체):
```tsx
import Link from "next/link";
import { works } from "@content/registry";
import { ThemeScope } from "@/themes/ThemeScope";
import { isDevBuild, listWorks, workHref } from "@/works/query";
import { SITE_DESCRIPTION, SITE_TITLE } from "../../site.config";

const KIND_LABEL = { deck: "덱", motion: "모션" } as const;

export default function HomePage() {
  const items = listWorks(works, { includeDrafts: isDevBuild() });
  return (
    <ThemeScope name="paper" className="min-h-dvh bg-bg text-fg">
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{SITE_TITLE}</h1>
          <p className="text-muted">{SITE_DESCRIPTION}</p>
        </header>
        {items.length === 0 ? (
          <p className="text-muted">아직 공개된 작업물이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {items.map((work) => (
              <li key={`${work.kind}/${work.slug}`}>
                <Link href={workHref(work)} className="flex flex-col gap-1 py-5 hover:opacity-80">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span>{KIND_LABEL[work.kind]}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={work.date}>{work.date}</time>
                    {work.draft && <span className="rounded bg-accent px-1.5 text-xs text-accent-fg">draft</span>}
                  </span>
                  <span className="text-xl font-bold">{work.title}</span>
                  <span className="text-muted">{work.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </ThemeScope>
  );
}
```

Run: `npm run check && npm run build && ls out/decks/hello/index.html out/motion/hello-motion/index.html`
Expected: 통과, 두 파일 존재.

- [ ] **Step 5: E2E 작성**

`tests/e2e/site.spec.ts` (전체 교체):
```ts
import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

test("목록 페이지가 공개 작업물을 링크하고 PDF 링크는 없다", async ({ page }) => {
  await page.goto(sitePath("/"));
  await expect(page.getByRole("heading", { level: 1, name: "public-posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: /public-posts 둘러보기/ })).toHaveAttribute("href", sitePath("/decks/hello/"));
  await expect(page.getByRole("link", { name: /움직이는 인사/ })).toHaveAttribute("href", sitePath("/motion/hello-motion/"));
  await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
});

test("작업물 페이지는 작업물별 제목과 OG 메타데이터를 가진다", async ({ page }) => {
  await page.goto(sitePath("/decks/hello/"));
  await expect(page).toHaveTitle("public-posts 둘러보기 · public-posts");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "public-posts 둘러보기");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", "발표·읽기·PDF로 보는 샘플 덱");
});

test("없는 slug는 404 페이지", async ({ page }) => {
  const res = await page.goto(sitePath("/decks/nope/"));
  expect(res?.status()).toBe(404);
  await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible();
});
```

`tests/e2e/deck.spec.ts`:
```ts
import { expect, test, type Page } from "@playwright/test";
import { sitePath } from "./helpers";

const DECK = sitePath("/decks/hello/");
const activeSlide = (page: Page) => page.locator('[data-slide-index][data-active="true"]');
const visibleSteps = (page: Page, slide: number) =>
  page.locator(`[data-slide-index="${slide}"] [data-step][data-visible="true"]`);

async function openDeck(page: Page, hash = "") {
  await page.goto(DECK + hash);
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "present");
}

test("키보드로 슬라이드와 스텝을 넘긴다", async ({ page }) => {
  await openDeck(page);
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "1");
  await expect(page).toHaveURL(/#1$/);

  await page.keyboard.press("ArrowRight");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "2");
  await expect(visibleSteps(page, 2)).toHaveCount(0);

  await page.keyboard.press("ArrowRight");
  await expect(visibleSteps(page, 2)).toHaveCount(1);
  await page.keyboard.press("Space");
  await page.keyboard.press("PageDown");
  await expect(visibleSteps(page, 2)).toHaveCount(3);

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#3$/);

  await page.keyboard.press("ArrowLeft");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "2");
  await expect(visibleSteps(page, 2)).toHaveCount(3);

  await page.keyboard.press("End");
  await expect(page).toHaveURL(/#4$/);
  await page.keyboard.press("Home");
  await expect(page).toHaveURL(/#1$/);
});

test("해시로 특정 슬라이드를 연다", async ({ page }) => {
  await openDeck(page, "#3");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "3");
});

test("범위 밖·잘못된 해시는 보정된다", async ({ page }) => {
  await openDeck(page, "#99");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "4");
  await expect(page).toHaveURL(/#4$/);

  await openDeck(page, "#abc");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "1");
  await expect(page).toHaveURL(/#1$/);
});

test("화면 오른쪽/왼쪽 클릭으로 넘긴다", async ({ page }) => {
  await openDeck(page);
  await page.mouse.click(1200, 450);
  await expect(page).toHaveURL(/#2$/);
  await page.mouse.click(200, 450);
  await expect(page).toHaveURL(/#1$/);
});

test("M 키로 읽기 모드와 발표 모드를 오간다", async ({ page }) => {
  await openDeck(page, "#2");
  await page.keyboard.press("m");
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "read");
  await expect(page.locator('[data-slide-index="1"]')).toHaveAttribute("data-canvas", "landscape");
  await page.keyboard.press("m");
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "present");
});

test("? 키로 도움말을 열고 아무 키로 닫는다", async ({ page }) => {
  await openDeck(page);
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "단축키" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#1$/);
});
```

`tests/e2e/print.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

test("인쇄 모드: landscape 캔버스로 모든 슬라이드와 스텝을 펼친다", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(sitePath("/decks/hello/?print"));
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "print");

  const slides = page.locator("[data-slide-index]");
  await expect(slides).toHaveCount(4);
  const sizes = await slides.evaluateAll((els) => els.map((el) => [el.clientWidth, el.clientHeight]));
  expect(sizes).toEqual(Array(4).fill([1920, 1080]));
  await expect(page.locator('[data-step][data-visible="false"]')).toHaveCount(0);
  await expect(page.locator('[data-overflow="true"]')).toHaveCount(0);
});

test("portrait 인쇄 검사 모드는 1080×1350 캔버스", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.goto(sitePath("/decks/hello/?print&canvas=portrait"));
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  const slides = page.locator("[data-slide-index]");
  await expect(slides.first()).toHaveAttribute("data-canvas", "portrait");
  const sizes = await slides.evaluateAll((els) => els.map((el) => [el.clientWidth, el.clientHeight]));
  expect(sizes).toEqual(Array(4).fill([1080, 1350]));
  await expect(page.locator('[data-overflow="true"]')).toHaveCount(0);
});
```

`tests/e2e/mobile.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

const DECK = sitePath("/decks/hello/");

test("세로 화면은 4:5 읽기 모드로 열고 모든 스텝을 보여준다", async ({ page }) => {
  await page.goto(DECK);
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "read");
  const slides = page.locator("[data-slide-index]");
  await expect(slides).toHaveCount(4);
  await expect(slides.first()).toHaveAttribute("data-canvas", "portrait");
  await expect(page.locator('[data-step][data-visible="false"]')).toHaveCount(0);
});

test("스크롤 위치가 해시에 반영되고, 가로로 돌려도 같은 슬라이드다", async ({ page }) => {
  await page.goto(DECK);
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "read");
  await page.locator('[data-card="2"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
  await expect(page).toHaveURL(/#3$/);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "present");
  await expect(page.locator('[data-slide-index][data-active="true"]')).toHaveAttribute("data-slide-index", "3");
});

test("딥링크 해시로 해당 카드까지 스크롤한다", async ({ page }) => {
  await page.goto(`${DECK}#4`);
  await expect(page.locator('[data-card="3"]')).toBeInViewport();
  await expect(page).toHaveURL(/#4$/);
});
```

`tests/e2e/motion.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

const MOTION = sitePath("/motion/hello-motion/");

test("보이면 재생하고 Space로 일시정지·재개, R로 다시 재생", async ({ page }) => {
  await page.goto(MOTION);
  const stage = page.locator("[data-motion-stage]");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-playing", "false");
  await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.keyboard.press("Space");
  await page.keyboard.press("r");
  await expect(stage).toHaveAttribute("data-playing", "true");
});

test("동작 줄이기 설정이면 재생하지 않고 최종 상태를 보여준다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(MOTION);
  await expect(page.locator("[data-motion-stage]")).toHaveAttribute("data-playing", "false");
  await expect(page.locator(".hm-caption")).toHaveCSS("opacity", "1");
});
```

- [ ] **Step 6: E2E 실행**

Run: `npm run build && npm run e2e`
Expected: 전부 PASS (desktop + mobile). 실패하면 superpowers:systematic-debugging으로 원인을 찾아 엔진(Task 6 파일) 또는 샘플을 고친다. 테스트의 기대값은 스펙에서 온 것이므로 테스트를 느슨하게 바꾸지 않는다.

- [ ] **Step 7: 개발 모드 수동 확인**

Run: `npm run dev` 후 브라우저로 `http://localhost:3000/public-posts/` → 덱 → 키보드 조작, 창을 세로로 좁혀 읽기 모드 전환을 눈으로 확인. 종료.

- [ ] **Step 8: 커밋**

```bash
npm run check
git add -A
git commit -m "feat: add work pages, sample deck and motion, and E2E coverage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 테마 갤러리 (개발 모드 전용)

**Files:**
- Create: `src/gallery/ThemeColumn.tsx`, `src/gallery/MotionTokenDemo.tsx`, `src/gallery/SampleSlide.tsx`, `src/app/gallery/page.dev.tsx`
- Modify: `tests/e2e/site.spec.ts` (갤러리 미포함 테스트 추가)

**Interfaces:**
- Consumes: `themes`, `themeNames`, `ThemeName`, `CONTRAST_PAIRS`, `contrastRatio`, `MIN_CONTRAST`, `CANVASES`, `TYPE_STEPS`, `COLOR_TOKENS`, `ThemeScope`, `StaticSlideFrame`, `Slide`, `Step`.
- Produces: dev 전용 라우트 `/public-posts/gallery/`.

- [ ] **Step 1: 실패하는 E2E 추가**

`tests/e2e/site.spec.ts` 끝에 추가:
```ts
test("테마 갤러리는 프로덕션 빌드에 없다", async ({ page }) => {
  const res = await page.goto(sitePath("/gallery/"));
  expect(res?.status()).toBe(404);
});
```

Run: `npm run build && npx playwright test tests/e2e/site.spec.ts`
Expected: PASS (아직 갤러리가 없으므로 404). 이 테스트는 갤러리를 추가한 뒤에도 PASS여야 하는 가드다.

- [ ] **Step 2: 갤러리 컴포넌트**

`src/gallery/SampleSlide.tsx`:
```tsx
import { Slide, Step } from "@/engine";

/** 테마가 어떻게 보이는지 확인하는 견본. 레이아웃 템플릿이 아니다. */
export function SampleSlide() {
  return (
    <Slide className="flex flex-col justify-between">
      <div className="flex flex-col gap-s3">
        <p className="text-caption text-muted">견본 · Sample</p>
        <h1 className="font-display text-h1 font-bold tracking-tight">테마가 적용된 슬라이드</h1>
      </div>
      <div className="flex flex-row gap-s4 portrait:flex-col">
        <Step className="flex-1 rounded-theme border border-border bg-surface p-s4">
          <p className="text-h2 font-bold">본문 카드</p>
          <p className="text-muted">설명 문장입니다. The quick brown fox.</p>
        </Step>
        <Step className="flex-1 rounded-theme bg-accent p-s4 text-accent-fg">
          <p className="text-h2 font-bold">강조 카드</p>
          <p>accent / accent-fg</p>
        </Step>
      </div>
    </Slide>
  );
}
```

`src/gallery/MotionTokenDemo.tsx`:
```tsx
"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { Theme } from "@/themes/types";

type Tokens = Theme["motion"];

export function MotionTokenDemo({ tokens }: { tokens: Tokens }) {
  const [run, setRun] = useState(0);
  const durations = Object.keys(tokens.duration) as (keyof Tokens["duration"])[];
  const easings = Object.keys(tokens.easing) as (keyof Tokens["easing"])[];

  return (
    <div className="flex flex-col gap-2">
      {durations.flatMap((d) =>
        easings.map((e) => (
          <div key={`${d}-${e}-${run}`} className="flex items-center gap-3 text-xs">
            <span className="w-40 shrink-0 font-mono">
              {d} {tokens.duration[d]}s · {e}
            </span>
            <div className="relative h-3 flex-1 rounded-full bg-surface">
              <motion.div
                className="absolute top-0 size-3 rounded-full bg-accent"
                initial={{ left: "0%" }}
                animate={{ left: "92%" }}
                transition={{ duration: tokens.duration[d], ease: tokens.easing[e] }}
              />
            </div>
          </div>
        )),
      )}
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="self-start rounded-md border border-border px-3 py-1 text-xs"
      >
        다시 재생
      </button>
    </div>
  );
}
```

`src/gallery/ThemeColumn.tsx`:
```tsx
import type { ReactNode } from "react";
import { StaticSlideFrame } from "@/engine";
import { themes, type ThemeName } from "@/themes";
import { CONTRAST_PAIRS, MIN_CONTRAST, contrastRatio } from "@/themes/contrast";
import { ThemeScope } from "@/themes/ThemeScope";
import { COLOR_TOKENS, TYPE_STEPS } from "@/themes/types";
import { MotionTokenDemo } from "./MotionTokenDemo";
import { SampleSlide } from "./SampleSlide";

const PREVIEW_SCALE = 0.3;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function ThemeColumn({ name }: { name: ThemeName }) {
  const theme = themes[name];
  return (
    <ThemeScope name={name} className="flex flex-col gap-8 rounded-2xl bg-bg p-5 text-fg">
      <h2 className="text-xl font-bold">
        {theme.label} <code className="text-sm font-normal text-muted">{name}</code>
      </h2>

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
                  {ratio.toFixed(2)}:1 {ok ? "✓" : `⚠ ${MIN_CONTRAST} 미만`}
                </span>
              </li>
            );
          })}
        </ul>
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
                <td className="pl-3 leading-tight" style={{ fontSize: theme.type.landscape[step] * PREVIEW_SCALE }}>
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
            <div key={gap} className="flex items-center gap-3 text-xs">
              <span className="w-16 font-mono">s{i + 1} {gap}</span>
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

`src/app/gallery/page.dev.tsx`:
```tsx
import type { Metadata } from "next";
import { ThemeColumn } from "@/gallery/ThemeColumn";
import { themeNames } from "@/themes";

export const metadata: Metadata = { title: "테마 갤러리 (dev)" };

export default function GalleryPage() {
  return (
    <main className="min-h-dvh bg-neutral-100 p-6 text-neutral-900">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold">테마 갤러리</h1>
        <p className="text-sm text-neutral-600">
          개발 모드 전용 · 프로덕션 빌드에 포함되지 않음 · 정의: <code>src/themes/</code>
        </p>
      </header>
      <div className="grid gap-6 xl:grid-cols-3">
        {themeNames.map((name) => (
          <ThemeColumn key={name} name={name} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 개발 모드에서 확인**

Run: `npm run dev` (백그라운드) 후 `curl -s http://localhost:3000/public-posts/gallery/ | grep -o "테마 갤러리" | head -1`
Expected: `테마 갤러리`. 브라우저로 열어 세 테마 열, 대비비, 견본 슬라이드(16:9, 4:5), 모션 "다시 재생"을 눈으로 확인한 뒤 dev 서버 종료.

- [ ] **Step 4: 프로덕션 미포함 확인**

Run: `npm run check && npm run build && test ! -e out/gallery && npx playwright test tests/e2e/site.spec.ts`
Expected: 통과 (`out/gallery`가 없고 E2E 404 테스트 PASS).

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add dev-only theme gallery

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: PDF 내보내기와 오버플로 검사

**Files:**
- Create: `scripts/lib/pdf-targets.ts`, `scripts/export-pdf.ts`
- Test: `tests/unit/pdf-targets.test.ts`

**Interfaces:**
- Consumes: `works`(`@content/registry`), `listWorks`, `CANVAS_SIZE`, `startServer`, `BASE_PATH`, `Canvas`.
- Produces:
  - `pdf-targets.ts`: `type PdfTarget = { slug: string; pagePath: string; outFile: string }` (`pagePath` 예: `decks/hello/`, `outFile` 예: `decks/hello.pdf`, 둘 다 basePath·out 기준 상대), `pdfTargets(works): PdfTarget[]`, `printUrl(siteUrl: string, target: PdfTarget, canvas: Canvas): string`, `type OverflowFailure = { slug: string; canvas: Canvas; slides: number[] }`, `formatFailures(failures): string`.
  - `npm run pdf`: 오버플로가 있으면 종료 코드 1, 없으면 `out/decks/<slug>.pdf` 생성.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/pdf-targets.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { Work } from "@/works/types";
import { formatFailures, pdfTargets, printUrl } from "../../scripts/lib/pdf-targets";

const load = async () => ({ default: () => null });
const base = { title: "t", description: "d", date: "2026-10-05", theme: "paper", load } as const;

const works: Work[] = [
  { ...base, kind: "deck", slug: "a" },
  { ...base, kind: "deck", slug: "wip", draft: true },
  { ...base, kind: "motion", slug: "m" },
];

describe("pdfTargets", () => {
  it("공개된 덱만, out 기준 경로로", () => {
    expect(pdfTargets(works)).toEqual([{ slug: "a", pagePath: "decks/a/", outFile: "decks/a.pdf" }]);
  });
});

describe("printUrl", () => {
  const target = { slug: "a", pagePath: "decks/a/", outFile: "decks/a.pdf" };
  it("landscape는 ?print, portrait는 canvas 파라미터 추가", () => {
    expect(printUrl("http://127.0.0.1:5000/public-posts/", target, "landscape")).toBe(
      "http://127.0.0.1:5000/public-posts/decks/a/?print",
    );
    expect(printUrl("http://127.0.0.1:5000/public-posts/", target, "portrait")).toBe(
      "http://127.0.0.1:5000/public-posts/decks/a/?print&canvas=portrait",
    );
  });
});

describe("formatFailures", () => {
  it("작업물·캔버스·슬라이드 번호를 알려준다", () => {
    const text = formatFailures([{ slug: "a", canvas: "portrait", slides: [2, 5] }]);
    expect(text).toContain("a");
    expect(text).toContain("portrait");
    expect(text).toContain("2, 5");
  });
});
```

Run: `npx vitest run tests/unit/pdf-targets.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 2: 구현**

`scripts/lib/pdf-targets.ts`:
```ts
import type { Canvas } from "@/themes/types";
import { listWorks } from "@/works/query";
import type { Work } from "@/works/types";

export type PdfTarget = { slug: string; pagePath: string; outFile: string };

export function pdfTargets(works: readonly Work[]): PdfTarget[] {
  return listWorks(works, { kind: "deck", includeDrafts: false }).map((work) => ({
    slug: work.slug,
    pagePath: `decks/${work.slug}/`,
    outFile: `decks/${work.slug}.pdf`,
  }));
}

/** siteUrl은 basePath까지 포함하고 슬래시로 끝난다 (startServer의 url). */
export function printUrl(siteUrl: string, target: PdfTarget, canvas: Canvas): string {
  return `${siteUrl}${target.pagePath}?print${canvas === "portrait" ? "&canvas=portrait" : ""}`;
}

export type OverflowFailure = { slug: string; canvas: Canvas; slides: number[] };

export function formatFailures(failures: readonly OverflowFailure[]): string {
  return failures
    .map((f) => `- ${f.slug} [${f.canvas}] 슬라이드 ${f.slides.join(", ")}: 내용이 캔버스를 넘칩니다`)
    .join("\n");
}
```

`scripts/export-pdf.ts`:
```ts
import { join } from "node:path";
import { chromium, type Browser } from "@playwright/test";
import { works } from "@content/registry";
import { CANVAS_SIZE } from "@/engine/canvas";
import type { Canvas } from "@/themes/types";
import { BASE_PATH } from "../site.config";
import { formatFailures, pdfTargets, printUrl, type OverflowFailure, type PdfTarget } from "./lib/pdf-targets";
import { startServer } from "./lib/serve";

const OUT = "out";
const READY_TIMEOUT = 30_000;
// portrait 검사를 먼저 해서 PDF를 만들기 전에 실패를 모은다.
const CANVAS_ORDER: Canvas[] = ["portrait", "landscape"];

async function render(browser: Browser, siteUrl: string, target: PdfTarget, canvas: Canvas): Promise<number[]> {
  const page = await browser.newPage({ viewport: CANVAS_SIZE[canvas] });
  try {
    await page.goto(printUrl(siteUrl, target, canvas), { waitUntil: "networkidle" });
    await page.waitForSelector('html[data-ready="true"]', { timeout: READY_TIMEOUT });
    const overflow = await page.$$eval('[data-slide-index][data-overflow="true"]', (els) =>
      els.map((el) => Number((el as HTMLElement).dataset.slideIndex)),
    );
    if (overflow.length === 0 && canvas === "landscape") {
      const { width, height } = CANVAS_SIZE.landscape;
      await page.pdf({
        path: join(OUT, target.outFile),
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        preferCSSPageSize: true,
      });
      console.log(`✓ ${target.outFile}`);
    }
    return overflow;
  } catch (error) {
    throw new Error(`${target.slug} [${canvas}] 렌더링 실패: ${(error as Error).message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const targets = pdfTargets(works);
  const server = await startServer({ root: OUT, basePath: BASE_PATH, port: 0 });
  const browser = await chromium.launch();
  const failures: OverflowFailure[] = [];
  try {
    for (const target of targets) {
      for (const canvas of CANVAS_ORDER) {
        const slides = await render(browser, server.url, target, canvas);
        if (slides.length > 0) failures.push({ slug: target.slug, canvas, slides });
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (failures.length > 0) {
    console.error(`캔버스 오버플로가 있어 PDF를 만들 수 없습니다:\n${formatFailures(failures)}`);
    process.exit(1);
  }
  console.log(`PDF ${targets.length}개 생성 완료`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 3: 단위 테스트 통과 확인**

Run: `npx vitest run tests/unit/pdf-targets.test.ts`
Expected: PASS.

- [ ] **Step 4: 실제 PDF 생성 확인**

Run: `npm run build && npm run pdf && file out/decks/hello.pdf && python3 -c "import re;d=open('out/decks/hello.pdf','rb').read();print('pages', len(re.findall(rb'/Type\s*/Page[^s]', d)))"`
Expected: `✓ decks/hello.pdf`, `PDF document`, `pages 4`.

- [ ] **Step 5: 오버플로 실패 경로 확인 (임시 변경)**

2번 슬라이드 제목을 임시로 아주 길게 만든다:

```bash
sed -i 's/>이 덱을 넘기는 법</>{"이 덱을 넘기는 법 ".repeat(40)}</' content/decks/hello/index.tsx
grep -c 'repeat(40)' content/decks/hello/index.tsx
```
Expected: `1`.

Run: `npm run build && npm run pdf; echo "exit=$?"`
Expected: 다음 두 줄을 포함한 메시지와 `exit=1`:
```
- hello [portrait] 슬라이드 2: 내용이 캔버스를 넘칩니다
- hello [landscape] 슬라이드 2: 내용이 캔버스를 넘칩니다
```

임시 변경을 되돌린다: `git checkout content/decks/hello/index.tsx`

- [ ] **Step 6: 커밋**

```bash
npm run check
git add -A
git commit -m "feat: export per-deck PDFs with canvas overflow checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 환경 매니페스트(CLAUDE.md)와 doctor

**Files:**
- Create: `scripts/lib/manifest.ts`, `scripts/doctor.ts`, `CLAUDE.md`
- Test: `tests/unit/manifest.test.ts`

**Interfaces:**
- Produces:
  - `manifest.ts`: `MANIFEST_START = "<!-- manifest:start -->"`, `MANIFEST_END = "<!-- manifest:end -->"`, `type ManifestRow = { name: string; version: string; locator: string }`, `parseManifest(markdown): ManifestRow[]`, `type SourceReader = (path: string) => string | null`, `resolveLocator(locator, read): string | null`, `type CheckResult = { ok: boolean; label: string; detail?: string }`, `checkManifest(rows, read): CheckResult[]`, `REQUIRED_LOCATORS: string[]`, `checkRequired(rows): CheckResult[]`, `type FontEntry = { family; version; file; license; licenseFile }`, `checkFonts(entries, exists: (fileName: string) => boolean): CheckResult[]`, `compareVersion(label, actual, expected): CheckResult`.
  - 로케이터 문법(출처 칸에 백틱으로 하나만): `.nvmrc` · `package.json#packageManager` · `package-lock.json#<패키지명>` · `src/fonts/fonts.json#<family>`.
  - `npm run doctor` (전체), `npm run doctor -- --manifest-only` (CI용: 매니페스트·폰트만).

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/manifest.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  MANIFEST_END,
  MANIFEST_START,
  checkFonts,
  checkManifest,
  checkRequired,
  compareVersion,
  parseManifest,
  resolveLocator,
  type SourceReader,
} from "../../scripts/lib/manifest";

const doc = `# 제목

${MANIFEST_START}
| 항목 | 버전 | 출처 | 재현 방법 |
|---|---|---|---|
| Node.js | 24.18.0 | \`.nvmrc\` | \`nvm install\` |
| npm | 11.16.0 | \`package.json#packageManager\` | \`npm i -g npm@11.16.0\` |
| next | 16.3.8 | \`package-lock.json#next\` | \`npm ci\` |
| Chromium (Playwright) | 1.63.0 | \`package-lock.json#@playwright/test\` | \`npx playwright install --with-deps chromium\` |
| Pretendard | 1.3.9 | \`src/fonts/fonts.json#Pretendard\` | Git에 포함 |
${MANIFEST_END}

나머지 내용
`;

const files: Record<string, string> = {
  ".nvmrc": "24.18.0\n",
  "package.json": JSON.stringify({ packageManager: "npm@11.16.0" }),
  "package-lock.json": JSON.stringify({
    packages: { "node_modules/next": { version: "16.3.8" }, "node_modules/@playwright/test": { version: "1.63.0" } },
  }),
  "src/fonts/fonts.json": JSON.stringify([{ family: "Pretendard", version: "1.3.9" }]),
};
const read: SourceReader = (path) => files[path] ?? null;

describe("parseManifest", () => {
  it("표시 사이의 표를 행으로 읽는다", () => {
    const rows = parseManifest(doc);
    expect(rows).toHaveLength(5);
    expect(rows[3]).toEqual({ name: "Chromium (Playwright)", version: "1.63.0", locator: "package-lock.json#@playwright/test" });
  });
  it("표시가 없으면 예외", () => {
    expect(() => parseManifest("# 없음")).toThrow(/manifest/);
  });
  it("출처에 백틱 로케이터가 없으면 예외", () => {
    const bad = `${MANIFEST_START}\n| a | b | c | d |\n|---|---|---|---|\n| x | 1.0.0 | 없음 | - |\n${MANIFEST_END}`;
    expect(() => parseManifest(bad)).toThrow(/x/);
  });
});

describe("resolveLocator", () => {
  it("각 출처에서 실제 버전을 읽는다", () => {
    expect(resolveLocator(".nvmrc", read)).toBe("24.18.0");
    expect(resolveLocator("package.json#packageManager", read)).toBe("11.16.0");
    expect(resolveLocator("package-lock.json#next", read)).toBe("16.3.8");
    expect(resolveLocator("package-lock.json#@playwright/test", read)).toBe("1.63.0");
    expect(resolveLocator("src/fonts/fonts.json#Pretendard", read)).toBe("1.3.9");
  });
  it(".nvmrc의 v 접두어는 무시", () => {
    expect(resolveLocator(".nvmrc", () => "v24.18.0")).toBe("24.18.0");
  });
  it("모르는 로케이터·없는 파일·없는 패키지는 null", () => {
    expect(resolveLocator("README.md", read)).toBeNull();
    expect(resolveLocator("package-lock.json#nope", read)).toBeNull();
    expect(resolveLocator(".nvmrc", () => null)).toBeNull();
  });
});

describe("checkManifest", () => {
  it("모두 일치하면 ok", () => {
    expect(checkManifest(parseManifest(doc), read).every((r) => r.ok)).toBe(true);
  });
  it("불일치는 문서값과 실제값을 보여준다", () => {
    const stale = doc.replace("| next | 16.3.8 |", "| next | 16.0.0 |");
    const failed = checkManifest(parseManifest(stale), read).filter((r) => !r.ok);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.detail).toContain("16.0.0");
    expect(failed[0]?.detail).toContain("16.3.8");
  });
});

describe("checkRequired", () => {
  it("필수 행이 빠지면 실패", () => {
    const rows = parseManifest(doc).filter((r) => r.locator !== ".nvmrc");
    const failed = checkRequired(rows).filter((r) => !r.ok);
    expect(failed.map((r) => r.label).join()).toContain(".nvmrc");
  });
});

describe("checkFonts", () => {
  const entry = { family: "Pretendard", version: "1.3.9", file: "a.woff2", license: "OFL-1.1", licenseFile: "L.txt" };
  it("폰트와 라이선스 파일이 있어야 한다", () => {
    expect(checkFonts([entry], () => true).every((r) => r.ok)).toBe(true);
    expect(checkFonts([entry], (f) => f !== "L.txt").filter((r) => !r.ok)).toHaveLength(1);
  });
});

describe("compareVersion", () => {
  it("일치 여부", () => {
    expect(compareVersion("Node", "24.18.0", "24.18.0").ok).toBe(true);
    expect(compareVersion("Node", "24.11.0", "24.18.0")).toEqual({
      ok: false,
      label: "Node",
      detail: "실행 중 24.11.0 ≠ 고정값 24.18.0",
    });
  });
});
```

Run: `npx vitest run tests/unit/manifest.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 2: 구현**

`scripts/lib/manifest.ts`:
```ts
export const MANIFEST_START = "<!-- manifest:start -->";
export const MANIFEST_END = "<!-- manifest:end -->";

export type ManifestRow = { name: string; version: string; locator: string };
export type SourceReader = (path: string) => string | null;
export type CheckResult = { ok: boolean; label: string; detail?: string };
export type FontEntry = { family: string; version: string; file: string; license: string; licenseFile: string };

/** 이 출처들은 매니페스트에서 빠지면 안 된다 */
export const REQUIRED_LOCATORS = [".nvmrc", "package.json#packageManager", "package-lock.json#next", "package-lock.json#@playwright/test"];

export function parseManifest(markdown: string): ManifestRow[] {
  const start = markdown.indexOf(MANIFEST_START);
  const end = markdown.indexOf(MANIFEST_END);
  if (start < 0 || end < start) {
    throw new Error(`CLAUDE.md에 manifest 표시(${MANIFEST_START} … ${MANIFEST_END})가 없습니다`);
  }
  const lines = markdown
    .slice(start + MANIFEST_START.length, end)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  // 머리글 행과 구분선을 건너뛴다. 칸 안에는 '|'를 쓰지 않는다.
  return lines.slice(2).map((line) => {
    const [name, version, source] = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const locator = /`([^`]+)`/.exec(source ?? "")?.[1];
    if (!name || !version || !locator) throw new Error(`매니페스트 행을 해석할 수 없습니다: ${line}`);
    return { name, version, locator };
  });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function resolveLocator(locator: string, read: SourceReader): string | null {
  const [path, key] = locator.split("#") as [string, string | undefined];
  const text = read(path);
  if (text === null) return null;

  if (path === ".nvmrc" && !key) return text.trim().replace(/^v/, "") || null;
  if (path === "package.json" && key === "packageManager") {
    const value = (parseJson(text) as { packageManager?: string } | null)?.packageManager;
    return value?.split("@")[1] ?? null;
  }
  if (path === "package-lock.json" && key) {
    const lock = parseJson(text) as { packages?: Record<string, { version?: string }> } | null;
    return lock?.packages?.[`node_modules/${key}`]?.version ?? null;
  }
  if (path.endsWith("fonts.json") && key) {
    const fonts = parseJson(text) as Pick<FontEntry, "family" | "version">[] | null;
    return fonts?.find((font) => font.family === key)?.version ?? null;
  }
  return null;
}

export function checkManifest(rows: readonly ManifestRow[], read: SourceReader): CheckResult[] {
  return rows.map((row) => {
    const actual = resolveLocator(row.locator, read);
    if (actual === null) return { ok: false, label: row.name, detail: `출처 \`${row.locator}\`에서 버전을 읽을 수 없습니다` };
    if (actual !== row.version) {
      return { ok: false, label: row.name, detail: `문서 ${row.version} ≠ 실제 ${actual} (${row.locator})` };
    }
    return { ok: true, label: `${row.name} ${row.version}` };
  });
}

export function checkRequired(rows: readonly ManifestRow[]): CheckResult[] {
  const present = new Set(rows.map((row) => row.locator));
  return REQUIRED_LOCATORS.map((locator) =>
    present.has(locator)
      ? { ok: true, label: `필수 행 ${locator}` }
      : { ok: false, label: `필수 행 ${locator}`, detail: "매니페스트 표에 이 출처의 행이 없습니다" },
  );
}

export function checkFonts(entries: readonly FontEntry[], exists: (fileName: string) => boolean): CheckResult[] {
  return entries.flatMap((font) =>
    [font.file, font.licenseFile].map((file) =>
      exists(file)
        ? { ok: true, label: `폰트 파일 ${file}` }
        : { ok: false, label: `폰트 파일 ${file}`, detail: `src/fonts/${file}가 없습니다 (${font.family})` },
    ),
  );
}

export function compareVersion(label: string, actual: string, expected: string): CheckResult {
  return actual === expected
    ? { ok: true, label: `${label} ${actual}` }
    : { ok: false, label, detail: `실행 중 ${actual} ≠ 고정값 ${expected}` };
}
```

`scripts/doctor.ts`:
```ts
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import {
  checkFonts,
  checkManifest,
  checkRequired,
  compareVersion,
  parseManifest,
  type CheckResult,
  type FontEntry,
  type SourceReader,
} from "./lib/manifest";

const read: SourceReader = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);

function runningNpmVersion(): string {
  const fromAgent = /npm\/(\S+)/.exec(process.env.npm_config_user_agent ?? "")?.[1];
  return fromAgent ?? execSync("npm --version", { encoding: "utf8" }).trim();
}

function manifestChecks(): CheckResult[] {
  const claude = read("CLAUDE.md");
  if (claude === null) return [{ ok: false, label: "CLAUDE.md", detail: "파일이 없습니다" }];
  try {
    const rows = parseManifest(claude);
    return [...checkRequired(rows), ...checkManifest(rows, read)];
  } catch (error) {
    return [{ ok: false, label: "매니페스트", detail: (error as Error).message }];
  }
}

function fontChecks(): CheckResult[] {
  const fonts = JSON.parse(read("src/fonts/fonts.json") ?? "[]") as FontEntry[];
  return checkFonts(fonts, (file) => existsSync(join("src/fonts", file)));
}

function environmentChecks(): CheckResult[] {
  const nvmrc = (read(".nvmrc") ?? "").trim();
  const packageManager = (JSON.parse(read("package.json") ?? "{}") as { packageManager?: string }).packageManager ?? "";
  const chromiumPath = chromium.executablePath();
  return [
    compareVersion("Node", process.versions.node, nvmrc),
    compareVersion("npm", runningNpmVersion(), packageManager.split("@")[1] ?? ""),
    existsSync(chromiumPath)
      ? { ok: true, label: "Playwright Chromium 설치됨" }
      : { ok: false, label: "Playwright Chromium", detail: "없음 → npx playwright install --with-deps chromium" },
  ];
}

const manifestOnly = process.argv.includes("--manifest-only");
const results = [...manifestChecks(), ...fontChecks(), ...(manifestOnly ? [] : environmentChecks())];

for (const result of results) {
  console.log(result.ok ? `✓ ${result.label}` : `✗ ${result.label} — ${result.detail}`);
}
const failed = results.filter((result) => !result.ok).length;
console.log(failed === 0 ? "\n환경이 매니페스트와 일치합니다." : `\n${failed}개 항목이 일치하지 않습니다.`);
process.exit(failed === 0 ? 0 : 1);
```

Run: `npx vitest run tests/unit/manifest.test.ts`
Expected: PASS.

- [ ] **Step 3: CLAUDE.md 작성**

설치된 실제 버전을 확인한다:
```bash
node -p "const l=require('./package-lock.json').packages; ['next','react','react-dom','motion','tailwindcss','typescript','eslint','vitest','@playwright/test','tsx'].map(n=>n+' '+l['node_modules/'+n].version).join('\n')"
```
아래 표의 버전이 출력과 다르면 **출력값으로** 적는다.

`CLAUDE.md`:
````markdown
# public-posts

웹에서 동작하는 슬라이드 덱·모션 그래픽을 만들어 GitHub Pages(`https://<id>.github.io/public-posts/`)에 정적 배포한다. 웹이 원본이고, 덱 PDF는 배포 때 자동 생성되어 `/public-posts/decks/<slug>.pdf`로만 접근한다(어디에도 링크하지 않음).

설계: `docs/superpowers/specs/2026-10-05-web-presentation-platform-design.md`

## 디렉터리

| 경로 | 역할 |
|---|---|
| `content/registry.ts` | 작업물 목록의 단일 출처 |
| `content/decks/<slug>/index.tsx` | 덱 (`<Deck>`의 직접 자식 하나 = 슬라이드 하나) |
| `content/motion/<slug>/index.tsx` | 독립 모션 (`<MotionStage>`) |
| `src/engine/` | 슬라이드 엔진. `*.ts` 순수 로직(단위 테스트), `*.tsx` 컴포넌트(E2E) |
| `src/themes/` | 테마 토큰(`paper`, `ink`, `signal`) → CSS 변수 |
| `src/fonts/` | 셀프호스팅 폰트 + `fonts.json`(버전·라이선스) |
| `src/app/gallery/page.dev.tsx` | 테마 갤러리 (dev 전용, 빌드 제외) |
| `scripts/` | `serve-out`(로컬 정적 서버), `export-pdf`, `doctor` |
| `site.config.ts` | `BASE_PATH` 등 사이트 상수 (basePath는 여기서만) |

## 명령어

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 `http://localhost:3000/public-posts/` (draft·갤러리 포함) |
| `npm run build` | 정적 빌드 → `out/` |
| `npm run preview` | `out/`을 `http://127.0.0.1:4173/public-posts/`로 서빙 |
| `npm run pdf` | 빌드 결과에서 덱 PDF 생성 + 캔버스 오버플로 검사 |
| `npm run check` | 타입체크 + 린트 + 단위 테스트 |
| `npm run e2e` | `out/` 대상 E2E (먼저 `build`) |
| `npm run doctor` | 환경이 아래 매니페스트와 일치하는지 검사 |

## 레시피

### 덱 추가
1. `content/decks/<slug>/index.tsx` 작성 — `export default function … { return <Deck>…</Deck> }`.
2. `content/registry.ts`에 항목 추가 (`kind: "deck"`, `load: () => import("./decks/<slug>")`). 작업 중이면 `draft: true`.
3. 슬라이드는 16:9(1920×1080)와 4:5(1080×1350) 두 캔버스에서 모두 넘치지 않아야 한다. 세로 배치는 `portrait:` 변형으로 쓴다 (예: `flex-row portrait:flex-col`).
4. `npm run dev`로 확인 → `npm run build && npm run pdf`로 오버플로 검사.

### 슬라이드 작성 규칙
- 테마 유틸리티: `bg-bg text-fg bg-surface text-muted bg-accent text-accent-fg border-border`, `text-display|h1|h2|body|caption`, `p-canvas`, `gap-s1…s6`, `rounded-theme`, `font-display`.
- `<Slide theme="ink">`로 슬라이드 한 장만 테마를 바꿀 수 있다.
- `<Step>`은 문서 순서대로 등장. 함께 등장시키려면 같은 `order`를 준다.
- 캔버스 밖으로 일부러 걸치는 장식 요소는 `data-bleed`를 붙여 오버플로 검사에서 뺀다.
- 슬라이드 안 링크·버튼은 클릭해도 넘어가지 않는다. 다른 요소를 막으려면 `data-no-nav`.

### 모션 추가
- `content/motion/<slug>/index.tsx`에서 `<MotionStage aspect loop sequence={(theme) => [...]}>`.
- 키프레임은 시작값부터 적는다 (`opacity: [0, 1]`) — 다시 재생(R)과 동작 줄이기 설정을 위해.
- Tailwind `scale-*`·`translate-*` 클래스는 CSS 개별 변형 속성을 써서 Motion의 transform과 겹친다. 애니메이션할 요소의 시작 변형은 인라인 `style`로 둔다.

### 테마 추가
1. `src/themes/<name>.ts` (`baseTokens` + `color`) → `src/themes/index.ts`의 `themes`에 등록.
2. `npm run test` — 대비 4.5:1 미만이면 실패한다. `npm run dev` 후 `/public-posts/gallery/`에서 확인.

### draft → 공개
레지스트리 항목에서 `draft: true`를 지운다. 종류별(deck/motion) 공개 작업물은 최소 1개가 있어야 한다 — Next 정적 export가 빈 `generateStaticParams()`를 거부하기 때문 (`tests/unit/registry.test.ts`가 검사).

## 환경 매니페스트

버전 값의 출처는 각 설정 파일이다. 이 표는 그 값을 옮겨 적은 것이며 `npm run doctor`가 일치 여부를 검사한다(CI에서도 `--manifest-only`로 검사). 표의 칸 안에는 `|`를 쓰지 않는다.

<!-- manifest:start -->
| 항목 | 버전 | 출처 | 재현 방법 |
|---|---|---|---|
| Node.js | 24.18.0 | `.nvmrc` | `nvm install && nvm use` |
| npm | 11.16.0 | `package.json#packageManager` | `npm install -g npm@11.16.0` |
| next | 16.3.8 | `package-lock.json#next` | `npm ci` |
| react | 19.3.0 | `package-lock.json#react` | `npm ci` |
| react-dom | 19.3.0 | `package-lock.json#react-dom` | `npm ci` |
| motion | 14.0.0 | `package-lock.json#motion` | `npm ci` |
| tailwindcss | 4.3.3 | `package-lock.json#tailwindcss` | `npm ci` |
| typescript | 6.0.3 | `package-lock.json#typescript` | `npm ci` |
| eslint | 9.39.5 | `package-lock.json#eslint` | `npm ci` |
| vitest | 5.0.3 | `package-lock.json#vitest` | `npm ci` |
| tsx | 4.23.15 | `package-lock.json#tsx` | `npm ci` |
| Playwright (Chromium 빌드 결정) | 1.63.0 | `package-lock.json#@playwright/test` | `npx playwright install --with-deps chromium` |
| Pretendard | 1.3.9 | `src/fonts/fonts.json#Pretendard` | Git에 포함 (OFL-1.1) |
<!-- manifest:end -->

마지막 검증: 2026-10-05 (WSL2 Ubuntu, `npm run doctor` 통과)

### 새 환경 준비 순서
1. Node: `nvm install && nvm use` (`.nvmrc`)
2. npm: `npm install -g npm@11.16.0`
3. 의존성: `npm ci` (`engine-strict`라 Node 버전이 다르면 여기서 멈춘다)
4. 브라우저: `npx playwright install --with-deps chromium` — Linux/WSL에서 OS 패키지 설치에 sudo가 필요하면 `sudo npx playwright install-deps chromium`. macOS는 `--with-deps` 없이도 된다.
5. 확인: `npm run doctor`

### 버전 고정 사유
- TypeScript 6.x: 7.x는 typescript-eslint 8의 peer 범위(`<6.1.0`) 밖이다. typescript-eslint가 7을 지원하면 올린다.
- ESLint 9.x: 10.x에서 eslint-config-next 16.3.8이 쓰는 eslint-plugin-react가 크래시한다.
- 환경 변수: 없음. 필요해지면 `.env.example`을 추가하고 이 문서에 적는다.

## Claude 작업 규칙

- 의존성·도구·시스템 요구사항(Node, npm, 패키지, 브라우저, 폰트, 환경 변수)을 바꾸면 **같은 커밋에서** 위 매니페스트 표와 "마지막 검증" 줄을 갱신하고 `npm run doctor`를 실행한다.
- 패키지는 정확한 버전으로 설치한다 (`.npmrc`의 `save-exact=true`, 또는 `npm i -E`).
- basePath(`/public-posts`)는 `site.config.ts`의 `BASE_PATH`만 쓴다. 문자열로 하드코딩하지 않는다.
- 덱·모션 화면에 버튼을 추가하지 않는다. 기능은 단축키로 제공한다.
- 작업물 추가·수정 후 `npm run check`, 그리고 덱이면 `npm run build && npm run pdf`로 오버플로를 확인한다.

## 저장소 밖 설정 (1회)

- GitHub 저장소 Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- 저장소는 public (무료 플랜의 GitHub Pages 조건).
````

- [ ] **Step 4: doctor 실행**

Run: `npm run doctor`
Expected: 모든 항목 `✓`, 마지막 줄 `환경이 매니페스트와 일치합니다.`, 종료 코드 0.

Run: `sed -i 's/| next | 16.3.8 |/| next | 16.0.0 |/' CLAUDE.md && npm run doctor -- --manifest-only; echo "exit=$?"; git checkout CLAUDE.md 2>/dev/null || sed -i 's/| next | 16.0.0 |/| next | 16.3.8 |/' CLAUDE.md`
Expected: `✗ next — 문서 16.0.0 ≠ 실제 16.3.8 (package-lock.json#next)`, `exit=1`. (CLAUDE.md가 아직 커밋 전이므로 `git checkout`이 실패하면 sed로 되돌린다.) 되돌린 뒤 `npm run doctor`가 다시 통과하는지 확인.

- [ ] **Step 5: 커밋**

```bash
npm run check
git add -A
git commit -m "feat: add environment manifest in CLAUDE.md and doctor checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: GitHub Actions 배포 워크플로

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: npm 스크립트 `doctor`, `check`, `build`, `pdf`, `e2e`.
- Produces: `main` push → Pages 배포, PR → 검사만.

- [ ] **Step 1: 워크플로 작성**

`.github/workflows/deploy.yml`:
```yaml
name: Build and deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Pin npm to packageManager
        run: npm install -g "$(node -p "require('./package.json').packageManager")"

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - name: Manifest matches pinned versions
        run: npm run doctor -- --manifest-only

      - run: npm run check

      - run: npm run build

      - name: Export PDFs (fails on canvas overflow)
        run: npm run pdf

      - run: npm run e2e

      - name: Disable Jekyll so _next/ is served
        run: touch out/.nojekyll

      - if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v5
        with:
          path: out

      - if: failure()
        uses: actions/upload-artifact@v5
        with:
          name: playwright-report
          path: test-results
          if-no-files-found: ignore

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-24.04
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: 액션 버전 확인**

Run:
```bash
for r in actions/checkout actions/setup-node actions/upload-pages-artifact actions/deploy-pages actions/upload-artifact; do printf "%s: " $r; git ls-remote --tags https://github.com/$r | grep -oE 'refs/tags/v[0-9]+$' | sed 's#refs/tags/##' | sort -V | tail -1; done
```
Expected: checkout v7, setup-node v7, upload-pages-artifact v5, deploy-pages v5. `upload-artifact`는 출력된 최신 메이저로 워크플로를 맞춘다. 다른 항목이 다르면 출력값으로 맞춘다.

- [ ] **Step 3: 로컬에서 CI와 같은 순서로 실행**

Run: `npm ci && npm run doctor -- --manifest-only && npm run check && npm run build && npm run pdf && npm run e2e && touch out/.nojekyll && ls out/.nojekyll out/decks/hello.pdf`
Expected: 모든 단계 통과, 두 파일 존재.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "ci: build, verify and deploy to GitHub Pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: GitHub 저장소 연결과 첫 배포 (사용자와 함께)

외부에 게시하는 작업이므로 각 단계 전에 사용자에게 확인받는다. `gh` CLI가 없으므로 저장소 생성과 Pages 설정은 사용자가 웹에서 한다.

**Files:** 없음 (원격·설정 작업)

- [ ] **Step 1: 브랜치 마무리**

superpowers:finishing-a-development-branch 스킬로 `feat/platform`을 `main`에 병합한다 (전체 검사 통과 확인 포함).

- [ ] **Step 2: 사용자에게 요청**

다음을 사용자에게 안내하고 GitHub 아이디(`<id>`)를 받는다:
1. GitHub에서 빈 public 저장소 `public-posts` 생성 (README·.gitignore 추가하지 않음).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.

- [ ] **Step 3: 원격 연결과 push (사용자 확인 후)**

```bash
git remote add origin https://github.com/<id>/public-posts.git
git push -u origin main
```
인증이 필요하면 사용자가 `! git push -u origin main`으로 직접 실행한다.

- [ ] **Step 4: 배포 확인**

사용자에게 Actions 탭에서 "Build and deploy"가 성공했는지 확인을 요청한 뒤:

```bash
curl -sI https://<id>.github.io/public-posts/ | head -1
curl -sI https://<id>.github.io/public-posts/decks/hello/ | head -1
curl -sI https://<id>.github.io/public-posts/decks/hello.pdf | grep -iE "^HTTP|content-type"
curl -sI https://<id>.github.io/public-posts/gallery/ | head -1
```
Expected: 앞의 셋은 `HTTP/2 200`(PDF는 `application/pdf`), 갤러리는 `HTTP/2 404`.

- [ ] **Step 5: 기록**

`CLAUDE.md` 첫 문단의 `<id>`를 실제 아이디로 바꾸고 커밋·push:

```bash
git add CLAUDE.md
git commit -m "docs: record GitHub Pages URL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
