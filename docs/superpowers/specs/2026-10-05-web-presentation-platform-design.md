# 웹 프레젠테이션 플랫폼 설계 (public-posts)

- 작성일: 2026-10-05
- 상태: 승인된 설계 → 구현 계획 작성 대기

## 1. 목적과 범위

### 1.1 목적
웹페이지에서 동작하는 슬라이드 덱과 모션 그래픽을 제작하여 GitHub Pages에 공개한다. 웹 작업물이 원본이며, PDF는 배포 시 자동으로 파생된다. 같은 작업물을 **직접 발표**(PC 전체화면)와 **공유 링크로 혼자 읽기**(PC·모바일) 양쪽에 사용한다.

### 1.2 요구사항 (사용자 확정)
| # | 요구사항 | 결정 |
|---|---|---|
| R1 | PC 웹·모바일 웹 모두 동작 | 발표 모드 + 읽기 모드, 모바일 세로는 4:5 리플로우 |
| R2 | 로컬 개발 모드, GitHub Pages 게시 | Next.js 정적 export + GitHub Actions 배포, 프로젝트 사이트 |
| R3 | Git 밖 환경 요소의 재현 문서를 지속 추적 | CLAUDE.md 환경 매니페스트 + `doctor` 자동 대조 |
| R4 | Next.js 적합성 | 적합. 정적 export로 사용(서버 기능 미사용) |
| R5 | 기본 템플릿 갤러리, 로컬 전용 | 테마(디자인 토큰)만 대상, dev 전용 페이지 |
| R6 | PDF | 배포 시 자동 생성, 화면에 버튼 없이 예측 가능한 URL로만 접근 |
| R7 | 모션 그래픽 | 슬라이드 내 애니메이션 + 독립 모션 작품 (영상 추출 제외) |

### 1.3 가정
- 작업물은 공개 콘텐츠이며 사이트 루트에 공개 작업물 목록 페이지가 있다.
- 주 콘텐츠 언어는 한국어(영문 혼용).
- 콘텐츠는 주로 Claude가 작성한다 → 작성 형식은 TSX.
- "다른 환경"은 다른 OS(WSL2/Linux/macOS)의 개발 머신과 CI를 포함한다.

### 1.4 범위 밖 (v1)
발표자 뷰(노트·다음 슬라이드 별도 창), 영상(MP4/GIF) 추출, MDX 작성, 슬라이드 레이아웃 템플릿, 모션 프리셋 템플릿, 콘텐츠 블록 템플릿, 커스텀 도메인.

## 2. 기술 스택

| 구성 | 선택 | 기준 버전(2026-10-05 조회) |
|---|---|---|
| 프레임워크 | Next.js App Router, `output: 'export'` | 16.3.x |
| UI | React | 19.3.x |
| 애니메이션 | Motion (구 Framer Motion) | 14.x |
| 스타일 | Tailwind CSS v4 (`@theme`로 CSS 변수 매핑) | 4.3.x |
| PDF·E2E | Playwright (Chromium) | 1.63.x |
| 단위 테스트 | Vitest | 구현 계획에서 확정 |
| 언어 | TypeScript | Next 16 호환 버전을 구현 계획에서 확인 후 고정 (7.x 호환 여부 검증) |
| 런타임 | Node.js / npm | 24.18.0 / 11.16.0 |
| 폰트 | Pretendard 등 저장소 내 셀프호스팅 | — |

검토 후 기각한 대안:
- **Astro + React 아일랜드**: 덱·모션이 대부분 클라이언트 인터랙션이라 JS 최소화 장점이 약하고, 컴포넌트 모델이 둘이 된다.
- **Slidev / reveal.js**: 다수 덱 저장소 운영, 모바일 읽기 모드, 독립 모션, 테마 갤러리 요구와 맞지 않는다.

## 3. 구조

### 3.1 디렉터리
```
public-posts/
├─ CLAUDE.md                  # 작업 규칙 + 환경 매니페스트
├─ .nvmrc                     # Node 버전 고정
├─ .npmrc                     # engine-strict=true
├─ package.json / package-lock.json
├─ next.config.ts             # output:'export', basePath, trailingSlash, pageExtensions
├─ content/
│  ├─ registry.ts             # 작업물 메타데이터의 단일 출처
│  ├─ decks/<slug>/           # index.tsx + assets/
│  └─ motion/<slug>/          # index.tsx + assets/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx             # 공개 작업물 목록
│  │  ├─ decks/[slug]/page.tsx
│  │  ├─ motion/[slug]/page.tsx
│  │  └─ gallery/page.dev.tsx # dev 전용 테마 갤러리
│  ├─ engine/                 # Deck, Slide, Step, 내비게이션, 모드, MotionStage
│  └─ themes/                 # Theme 타입, 테마 정의, ThemeProvider
├─ public/fonts/
├─ scripts/
│  ├─ serve-out.ts            # basePath를 흉내 내는 정적 서버 (node:http)
│  ├─ export-pdf.ts           # 덱별 PDF 생성 + 오버플로 검사
│  └─ doctor.ts               # 환경·매니페스트 검사
├─ tests/                     # unit / e2e
├─ docs/superpowers/specs/
└─ .github/workflows/deploy.yml
```

### 3.2 URL
| 대상 | URL |
|---|---|
| 목록 | `https://<id>.github.io/public-posts/` |
| 덱 | `/public-posts/decks/<slug>/` (슬라이드 위치는 해시 `#7`) |
| 덱 PDF | `/public-posts/decks/<slug>.pdf` (어디에도 링크하지 않음) |
| 모션 작품 | `/public-posts/motion/<slug>/` |
| 갤러리 (dev만) | `http://localhost:3000/public-posts/gallery` |

`trailingSlash: true`로 각 페이지를 `<path>/index.html`로 내보내 GitHub Pages가 그대로 서빙하게 한다. basePath는 `next.config.ts` 한 곳에서 관리한다.

### 3.3 레지스트리 (`content/registry.ts`)
작업물 목록, 정적 경로 생성(`generateStaticParams`), PDF 대상 목록, OG 메타데이터의 단일 출처다.

```ts
type Work = {
  slug: string;              // URL 세그먼트, 고유
  kind: 'deck' | 'motion';
  title: string;
  description: string;       // 목록·OG 설명
  date: string;              // YYYY-MM-DD
  theme: ThemeName;          // 기본 테마
  draft?: boolean;           // true면 dev에서만 보이고 프로덕션 빌드에서 제외
  load: () => Promise<{ default: React.ComponentType }>; // 작업물별 코드 분할
};
```

작업물 추가 = `content/<kind>/<slug>/index.tsx` 작성 + 레지스트리 항목 1개.

### 3.4 dev 전용 페이지
`pageExtensions`에 `dev.tsx`를 개발 모드에서만 포함한다. `*.dev.tsx` 페이지는 프로덕션 빌드에서 라우트로 인식되지 않으므로 배포물에 포함되지 않는다.

## 4. 슬라이드 엔진 (`src/engine`)

### 4.1 캔버스
| 캔버스 | 논리 크기 | 사용처 |
|---|---|---|
| landscape | 1920×1080 (16:9) | 발표 모드, 가로 화면, PDF |
| portrait | 1080×1350 (4:5) | 모바일 세로 읽기 모드 |

- 슬라이드는 논리 크기로 레이아웃되고 뷰포트에 맞게 `transform: scale`로 축소·확대된다(레터박스).
- 슬라이드 루트에 `data-canvas="landscape|portrait"`를 두고, Tailwind 커스텀 variant `portrait:`로 세로 배치를 작성한다(예: `flex-row portrait:flex-col`).
- 모든 덱 슬라이드는 두 캔버스 모두에서 오버플로 없이 렌더되어야 한다(6.2의 검사로 강제).

### 4.2 모드
| | 발표 모드 | 읽기 모드 |
|---|---|---|
| 기본 적용 | PC, 가로 화면 | 모바일 세로 |
| 캔버스 | landscape | portrait |
| 탐색 | `→ Space PgDn` 다음 / `← PgUp` 이전 / `Home End`, 화면 좌·우 절반 클릭/탭 | 세로 scroll-snap 스와이프·스크롤 |
| `<Step>` | 하나씩 등장 | 모두 표시 |
| 전환·모션 | 재생 | 슬라이드가 화면에 들어올 때 가볍게 |

- 자동 선택: 뷰포트가 세로(높이 > 너비)이면 읽기 모드, 아니면 발표 모드. 방향이 바뀌면 현재 슬라이드를 유지한 채 전환. 수동 지정: `M` 키 또는 `?mode=read|present` (수동 지정이 자동 선택보다 우선).
- `F` 전체화면 토글, `?` 단축키 도움말 오버레이.
- 화면 UI는 얇은 진행 바(발표)와 점 인디케이터(읽기)뿐. 버튼 없음.
- 해시 `#n`(1부터)이 현재 슬라이드를 나타내며 새로고침·링크 공유 시 유지된다. 범위 밖 값은 가장 가까운 유효값으로 보정.

### 4.3 인쇄 모드 (`?print`)
- 모든 슬라이드를 landscape 논리 크기로 세로로 나열, 모든 Step 표시, 애니메이션·전환 비활성화.
- `?print&canvas=portrait`는 portrait 캔버스로 동일하게 렌더(검사 전용, PDF 생성 안 함).
- 폰트 로드와 레이아웃이 끝나면 문서 루트에 `data-ready="true"`를 설정한다.
- 각 슬라이드는 콘텐츠가 캔버스를 넘치면 `data-overflow="true"`를 표시한다.
- CSS `@page { size: 1920px 1080px; margin: 0 }`.

### 4.4 애니메이션
- `<Step order? effect?>`: 순차 등장. `effect`는 엔진 내장 `fade`(기본) `rise` `scale` 중 하나. 지속시간·이징은 테마 motion 토큰을 사용.
- 슬라이드 전환: Motion `AnimatePresence`. 기본 `fade`, 덱 단위로 지정 가능.
- `prefers-reduced-motion: reduce`이면 모든 효과를 짧은 페이드로 대체.

### 4.5 독립 모션 작품
- `<MotionStage aspect="16:9|4:5|1:1" loop?>`: 고정 논리 캔버스 + 스케일링(덱과 동일 원리).
- 뷰포트에 보이면 자동 재생, 탭/`Space` 일시정지·재개, `R` 다시 재생.
- 타임라인은 Motion `animate()` 시퀀스로 작성. PDF 생성 대상이 아니다.

### 4.6 JS 없이
정적 export된 HTML에는 슬라이드가 세로로 나열된 상태가 들어 있어 JS가 없어도 내용을 읽을 수 있다(스케일링·탐색·애니메이션은 없음).

## 5. 테마 (`src/themes`)

### 5.1 토큰
| 레이어 | 토큰 |
|---|---|
| color | `bg` `surface` `fg` `muted` `accent` `accent-fg` `border` |
| typography | 패밀리 `sans` `display` `mono` / 크기 `display` `h1` `h2` `body` `caption` (landscape·portrait 각각, 논리 px) / 줄간격·자간 |
| space | 캔버스 패딩(캔버스별), gap `1`–`6`, `radius` |
| motion | `duration.fast/base/slow`, `easing.standard/emphasized` |

- 테마는 `Theme` 타입 객체(`src/themes/<name>.ts`)이며 누락 토큰은 타입 오류다.
- `ThemeProvider`가 `[data-theme]` 루트에 CSS 변수로 주입하고, Tailwind v4 `@theme`이 변수를 유틸리티 클래스(`bg-surface`, `text-fg`, `text-h1` 등)에 매핑한다. 타이포 크기 변수는 `data-canvas`에 따라 값이 바뀐다.
- 적용 우선순위: `<Slide theme>` > 레지스트리 `theme`.

### 5.2 기본 테마 3종
- `paper`: 밝은 배경·검정 텍스트·포인트 컬러 1개. 문서·강의형 기본.
- `ink`: 어두운 배경·고대비. 프로젝터·어두운 장소.
- `signal`: 강한 컬러 배경·흰 텍스트. 표지·섹션 구분·모션 작품.

세 테마 모두 `fg/bg`, `accent-fg/accent` 대비 4.5:1 이상을 충족한다(단위 테스트로 강제).

### 5.3 갤러리 (`/gallery`, dev 전용)
테마별로:
1. 컬러 스와치 + 토큰명 + WCAG 대비비(4.5:1 미만 경고)
2. 타입 스펙시먼(한/영 혼용, landscape·portrait 크기 병기)
3. 간격·라운드 스케일
4. 모션 토큰 데모(다시 재생 가능)
5. 견본 슬라이드 1장을 16:9·4:5로 렌더 (레이아웃 템플릿이 아님)

추가로 테마 나란히 비교 보기를 제공한다.

## 6. 빌드·배포·PDF

### 6.1 스크립트
| 명령 | 동작 |
|---|---|
| `npm run dev` | `next dev` (갤러리·draft 포함) |
| `npm run build` | `next build` → `out/` |
| `npm run pdf` | `serve-out` 기동 → 덱별 인쇄 모드 검사 → `out/decks/<slug>.pdf` 생성 |
| `npm run check` | 타입체크 + 린트 + 단위 테스트 |
| `npm run e2e` | `out/` 대상 E2E |
| `npm run doctor` | 환경·매니페스트 검사 (`--manifest-only`로 매니페스트 대조만) |

### 6.2 PDF 생성 (`scripts/export-pdf.ts`)
레지스트리에서 draft가 아닌 덱마다:
1. `/public-posts/decks/<slug>/?print&canvas=portrait` 방문 → `data-ready` 대기 → `data-overflow` 슬라이드가 있으면 실패 목록에 추가.
2. `/public-posts/decks/<slug>/?print` 방문 → `data-ready` 대기 → 오버플로 검사 → `page.pdf({ width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })`로 `out/decks/<slug>.pdf` 저장.
3. 실패 목록이 비어 있지 않으면 작업물·슬라이드 번호·캔버스를 출력하고 비정상 종료.

`serve-out`은 `out/`을 `/public-posts` 경로 아래로 서빙하는 `node:http` 기반 스크립트로, 추가 의존성이 없다.

### 6.3 GitHub Actions (`.github/workflows/deploy.yml`)
- 트리거: `main` push → 빌드+배포, PR → 빌드·검사만.
- 단계: checkout → `setup-node`(`node-version-file: .nvmrc`, npm 캐시) → `npm ci` → `npx playwright install --with-deps chromium` → `npm run doctor -- --manifest-only` → `npm run check` → `npm run build` → `npm run pdf` → `npm run e2e` → `out/.nojekyll` 생성 → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- 어느 단계든 실패하면 배포하지 않으며 기존 사이트가 유지된다.
- `.nojekyll`은 `_next/` 디렉터리가 Jekyll에 의해 숨겨지는 것을 막는다.
- 1회 수동 설정: 저장소 Settings → Pages → Source = "GitHub Actions" (CLAUDE.md에 기록).

## 7. 환경 재현 (R3)

### 7.1 원칙
버전 값은 설정 파일에만 존재한다(단일 출처). CLAUDE.md는 그 값을 설명·요약하고, `doctor`가 문서와 설정 파일의 일치를 검사한다.

### 7.2 고정 대상
| 대상 | 고정 위치 | 재현 방법 |
|---|---|---|
| npm 패키지 | `package-lock.json` (Git 커밋) | `npm ci` |
| Node | `.nvmrc`, `package.json` `engines.node`, `.npmrc` `engine-strict=true` | `nvm use` |
| npm | `package.json` `packageManager` | 해당 버전 설치 |
| PDF용 Chromium | `@playwright/test` 버전(lockfile)에 종속 | `npx playwright install --with-deps chromium` |
| OS 의존성 | Playwright `--with-deps` | WSL2/Linux/macOS별 메모를 CLAUDE.md에 |
| 폰트 | `public/fonts/` (Git 커밋) | 없음 |
| 환경 변수 | v1에는 없음 | 필요해지면 `.env.example` 추가 |

### 7.3 CLAUDE.md 구성
1. 프로젝트 개요·디렉터리 지도
2. 명령어
3. 레시피: 작업물 추가 / 테마 추가 / draft → 공개
4. **환경 매니페스트**: 7.2 표를 기반으로 한 `| 도구 | 버전 | 출처 파일 | 설치 명령 |` 표 + "마지막 검증일"
5. **Claude 규칙**: 의존성·도구·시스템 요구사항을 바꾸면 같은 커밋에서 매니페스트를 갱신하고 `npm run doctor`를 실행한다
6. GitHub Pages 1회 설정 등 저장소 밖 수동 설정 기록

### 7.4 `npm run doctor`
| 검사 | 로컬 | CI(`--manifest-only`) |
|---|---|---|
| 실행 중인 Node/npm 버전이 고정값과 일치 | ✓ | — (setup-node가 보장) |
| Playwright Chromium 설치 여부 | ✓ | — |
| `public/fonts/` 필수 파일 존재 | ✓ | ✓ |
| CLAUDE.md 매니페스트 표의 버전 = `.nvmrc`·`package.json`·lockfile의 실제 값 | ✓ | ✓ |

불일치 시 항목별로 기대값·실제값을 출력하고 비정상 종료한다.

## 8. 테스트

| 종류 | 도구 | 대상 |
|---|---|---|
| 단위 | Vitest | 슬라이드·스텝 내비게이션 로직(경계, 해시 파싱·보정), 레지스트리 검증(slug 고유, 테마 존재, 폴더 존재), 테마 토큰 완전성, 대비비 계산 및 기본 테마 4.5:1 충족, doctor의 매니페스트 파서 |
| E2E | Playwright | 샘플 덱: 키보드 탐색·해시 딥링크, 390×844 세로 뷰포트 읽기 모드, `?print` 렌더, 미지의 slug → 404 |
| 파이프라인 | `npm run pdf` | 오버플로 검사 + PDF 생성 성공 |

시작 작업물로 샘플 덱 1개(`hello`)와 샘플 모션 1개(`hello-motion`)를 공개 작업물로 둔다. E2E의 대상이며, 삭제 시 테스트 대상을 교체해야 한다.

## 9. 오류 처리

| 상황 | 동작 |
|---|---|
| 없는 slug | 정적 `404.html` |
| 슬라이드 내용이 캔버스 초과 | `npm run pdf` 실패, 작업물·슬라이드·캔버스 보고, 배포 중단 |
| PDF 생성 실패 | 배포 중단, 기존 버전 유지 |
| 폰트 로드 실패 | 시스템 폰트 폴백 (레이아웃 유지) |
| JS 비활성 | 사전 렌더된 슬라이드 세로 나열 |
| CLAUDE.md 매니페스트 불일치 | CI 실패 |

## 10. 구현 전 준비 사항
- 현재 디렉터리는 Git 저장소가 아니며 `gh` CLI가 없다. GitHub 저장소(`public-posts`) 생성과 첫 push는 사용자가 직접 하거나 `gh` 설치 후 진행한다. 구현 계획에 단계로 포함한다.
- TypeScript 버전은 Next 16 호환성을 확인한 뒤 고정한다.
