@AGENTS.md

# public-posts

웹에서 동작하는 슬라이드 덱·모션 그래픽을 만들어 GitHub Pages(`https://yonghaklee.github.io/public-posts/`)에 정적 배포한다. 웹이 원본이고, 덱 PDF는 배포 때 자동 생성되어 `/public-posts/decks/<slug>.pdf`로만 접근한다(어디에도 링크하지 않음).

설계: `docs/superpowers/specs/2026-10-05-web-presentation-platform-design.md`

## 디렉터리

| 경로 | 역할 |
|---|---|
| `content/registry.ts` | 작업물 목록의 단일 출처 |
| `content/decks/<slug>/index.tsx` | 덱 (`<Deck>`의 직접 자식 하나 = 슬라이드 하나) |
| `content/motion/<slug>/index.tsx` | 독립 모션 (`<MotionStage>`) |
| `src/engine/` | 슬라이드 엔진. `*.ts` 순수 로직(단위 테스트), `*.tsx` 컴포넌트(E2E) |
| `src/themes/` | 테마 13개(태그로 분류, `defineTheme`) → CSS 변수 |
| `src/fonts/` | 셀프호스팅 폰트(Pretendard, Hahmlet 명조, Black Han Sans 디스플레이) + `fonts.json`(버전·출처·라이선스) + `registry.ts` |
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
- 뷰포트 반응형 변형(`sm:`·`md:`·`lg:`·`xl:`·`2xl:`)과 뷰포트 단위(`vw`·`vh`·`dvh`·`svh`·`lvh`, `h-screen` 등)는 쓰지 않는다. 캔버스 차이는 `portrait:`로만 표현한다. 이들은 실제 창 크기에 반응하는데 오버플로 검사는 정확히 1080×1350 / 1920×1080에서만 돌기 때문에, 390px 폰에서 보이는 다른 레이아웃을 검사가 승인할 수 있다. `tests/unit/content-rules.test.ts`가 `content/decks`·`content/motion` 소스를 스캔해 어기면 실패시킨다.
- 이미지는 `content/decks/<slug>/assets/`에 두고 정적 import 한다 (`import pic from "./assets/pic.png"` → `pic.src` 또는 `next/image`). `"/x.png"` 같은 문자열 경로는 basePath를 무시하므로 쓰지 않는다.
- 옵션: `<Deck transition="fade|slide|none">`, `<Step effect="fade|rise|scale">`.
- 발표 모드는 모든 슬라이드를 마운트해 둔다. 영상·오디오는 `useSlideActive()`(`@/engine`)가 true일 때만 재생하고 false면 멈춘다.
- 미리보기(데스크톱 브라우저): `?mode=read`(읽기 모드), `?print`·`?print&canvas=portrait`(인쇄·오버플로 검사 화면).
- 슬라이드 안 링크·버튼은 클릭해도 넘어가지 않는다. 다른 요소를 막으려면 `data-no-nav`.

### 모션 추가
- `content/motion/<slug>/index.tsx`에서 `<MotionStage aspect loop sequence={(theme) => [...]}>`.
- 키프레임은 시작값부터 적는다 (`opacity: [0, 1]`) — 다시 재생(R)과 동작 줄이기 설정을 위해.
- Tailwind `scale-*`·`translate-*` 클래스는 CSS 개별 변형 속성을 써서 Motion의 transform과 겹친다. 애니메이션할 요소의 시작 변형은 인라인 `style`로 둔다.

### 테마 추가
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

### draft → 공개
레지스트리 항목에서 `draft: true`를 지운다. 종류별(deck/motion) 공개 작업물은 최소 1개가 있어야 한다 — Next 정적 export가 빈 `generateStaticParams()`를 거부하기 때문 (`tests/unit/registry.test.ts`가 검사). draft는 목록·라우트·PDF에서만 빠질 뿐 비공개가 아니다 — 저장소가 public이고 레지스트리가 클라이언트 번들에 포함되므로 제목과 코드는 볼 수 있다.

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
| Hahmlet | google-fonts@9710da1eacb3 | `src/fonts/fonts.json#Hahmlet` | Git에 포함 (OFL-1.1) |
| Black Han Sans | google-fonts@9710da1eacb3 | `src/fonts/fonts.json#Black Han Sans` | Git에 포함 (OFL-1.1) |
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
- `AGENTS.md`는 `next dev`가 관리하는 Next.js 안내 블록이다. 직접 수정하지 않는다 (Next 버전을 올리면 `next dev`가 갱신하며, 그 변경은 함께 커밋한다).

## 저장소 밖 설정 (1회)

- GitHub 저장소 Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- 저장소는 public (무료 플랜의 GitHub Pages 조건).
