# 테마 확장과 분류형 갤러리 설계

- 작성일: 2026-10-05
- 상태: 승인된 설계 → 구현 계획 작성 대기
- 선행 설계: `docs/superpowers/specs/2026-10-05-web-presentation-platform-design.md` (§5 테마)

## 1. 목적과 범위

### 1.1 목적
덱·모션에 쓸 테마를 3개에서 13개로 늘리고, 개발 모드 갤러리에서 느낌·스타일 태그로 분류해 고를 수 있게 한다. 스타일 차이는 주로 타이포그래피에서 나오므로 테마별 글꼴·타입 스케일·여백을 다르게 할 수 있어야 한다.

### 1.2 요구사항 (사용자 확정)
| # | 요구사항 | 결정 |
|---|---|---|
| G1 | 테마 개수 확대 | 13개 (기존 3 + 신규 10) |
| G2 | 느낌·스타일별 분류 | 테마당 태그 1~3개, 태그 10종 |
| G3 | 스타일 차이 표현 | 테마별 글꼴 허용 (명조 1종, 디스플레이 1종 추가) |
| G4 | 갤러리 화면 | 태그 필터 + 카드 그리드 + 선택한 테마 상세·비교 |
| G5 | 갤러리는 로컬 전용 | 기존과 동일하게 dev 전용, 프로덕션 빌드 제외 |

### 1.3 범위 밖
테마 편집 UI, 사용자 정의 태그, 레이아웃 템플릿, 테마별 장식 요소(괘선·쪽번호 등), 여러 태그 동시 필터(AND/OR).

## 2. 데이터 모델

### 2.1 태그
```ts
export const THEME_TAGS = ["논문", "학술", "산뜻", "차분", "화려", "색채", "다크", "미니멀", "비즈니스", "따뜻함"] as const;
export type ThemeTag = (typeof THEME_TAGS)[number];
```
`THEME_TAGS`의 순서가 갤러리 필터 순서다.

### 2.2 Theme 타입 확장
기존 `Theme`에 두 필드를 추가한다. 나머지 토큰(color, font, type, leading, tracking, space, radius, motion)은 그대로다.

```ts
type Theme = {
  label: string;
  description: string;   // 한 줄 설명. 갤러리 카드·상세에 표시
  tags: readonly ThemeTag[]; // 1~3개, 중복 없음
  // …기존 토큰
};
```

### 2.3 defineTheme
`defineTheme(spec)`는 기본 토큰(`baseTokens`)에 테마가 바꾸는 값만 깊게(depth-aware) 병합해 완전한 `Theme`를 만든다. 테마 파일은 색·이름·설명·태그와 다른 부분만 적는다. 객체 토큰(type, space, motion 등)은 하위 키 단위로 병합하고, 배열(gap, easing)은 통째로 교체한다.

### 2.4 테마 등록
`src/themes/index.ts`의 `themes` 객체에 13개를 등록한다. `ThemeName`·`themeNames`·`isThemeName`의 계약은 그대로이며, 기존 이름(`paper`, `ink`, `signal`)과 그 외형은 바뀌지 않는다(태그·설명만 추가).

## 3. 글꼴

### 3.1 추가 글꼴 (2종)
| 역할 | 후보 | 선정 기준 |
|---|---|---|
| 명조(세리프) 가족 | 마루부리, Noto Serif KR | OFL 라이선스, woff2, Regular·Bold 이상, 한글 전체 글리프, 전체 용량이 작은 쪽 |
| 디스플레이 | Black Han Sans 등 굵은 제목용 한글 글꼴 | OFL, woff2, 단일 굵은 굵기 |

구체 글꼴과 파일은 구현 계획 단계에서 용량·라이선스를 확인해 고정한다. 기본(Pretendard)과 코드용(시스템 모노 스택)은 그대로다.

### 3.2 로딩
- `src/fonts/index.ts`에 `next/font/local`로 등록하고 각자 CSS 변수(`--font-<이름>`)를 갖는다. 루트 레이아웃이 모든 글꼴 변수 클래스를 `<html>`에 붙인다.
- 새 글꼴은 `preload: false`로 선언한다. 브라우저는 실제로 그 글꼴로 렌더되는 텍스트가 있을 때만 파일을 내려받으므로, Pretendard 테마만 쓰는 덱은 추가 용량이 없다.
- 테마의 `font.sans|display|mono` 값은 `var(--font-<이름>)`로 시작하는 스택이며, 글꼴별 스택 문자열은 `src/themes/fonts.ts`(신규) 한 곳에 정의한다.

### 3.3 환경 재현
새 글꼴마다 `src/fonts/fonts.json` 항목(family, version, file, license, licenseFile)과 라이선스 파일을 추가하고, `CLAUDE.md` 매니페스트에 `src/fonts/fonts.json#<family>` 행을 추가한다. `npm run doctor`가 파일 존재와 버전 일치를 검사한다(기존 메커니즘).

## 4. 테마 목록 (13개)

색 값은 구현 계획에서 정하되 §6의 대비 규칙을 만족해야 한다.

| 이름 | 태그 | 느낌 | 글꼴 (본문 / 제목) | 토큰 차이 |
|---|---|---|---|---|
| `paper` (기존) | 학술·차분·미니멀 | 따뜻한 흰 배경, 검정 글자, 파랑 포인트 | Pretendard | 없음 |
| `ink` (기존) | 다크·차분·미니멀 | 어두운 배경, 고대비 | Pretendard | 없음 |
| `signal` (기존) | 화려·색채 | 강한 빨강 배경, 흰 글자 | Pretendard | 없음 |
| `thesis` | 논문·학술·미니멀 | 순백, 검정 명조, 남색 포인트 | 명조 / 명조 | 논문 스케일, radius 0 |
| `journal` | 논문·학술·따뜻함 | 아이보리, 명조, 짙은 버건디 포인트 | 명조 / 명조 | 논문 스케일, radius 0 |
| `lecture` | 학술·산뜻 | 흰 배경, 청록 포인트 | Pretendard | 없음 |
| `breeze` | 산뜻·미니멀 | 아주 옅은 하늘색, 남색 글자 | Pretendard | 여백 넓게 |
| `mint` | 산뜻·색채 | 민트 배경, 진녹 글자, 코랄 포인트 | Pretendard | 없음 |
| `slate` | 비즈니스·차분 | 회청색 표면, 진회색 글자 | Pretendard | radius 작게 |
| `boardroom` | 비즈니스·다크 | 짙은 남색 배경, 금색 포인트 | Pretendard | radius 작게 |
| `neon` | 화려·다크·색채 | 검정에 가까운 배경, 마젠타 포인트 | Pretendard / 디스플레이 | 화려 스케일·모션 |
| `pop` | 화려·색채 | 쨍한 노랑 배경, 검정 글자 | Pretendard / 디스플레이 | 화려 스케일·모션, radius 크게 |
| `terracotta` | 따뜻함·차분 | 베이지 배경, 테라코타 포인트 | Pretendard / 명조 | 없음 |

태그별 테마 수: 논문 2, 학술 4, 산뜻 3, 차분 4, 화려 3, 색채 4, 다크 3, 미니멀 4, 비즈니스 2, 따뜻함 2.

### 4.1 스타일별 토큰 프리셋
- **논문 스케일** (`thesis`, `journal`): landscape display 112 / h1 72 / h2 52 / body 34 / caption 24, portrait display 96 / h1 64 / h2 48 / body 34 / caption 26, leading normal 1.7, pad landscape 144 / portrait 112, radius 0.
- **화려 스케일·모션** (`neon`, `pop`): landscape display 168 / h1 108 / h2 72, portrait display 132 / h1 92 / h2 64 (body·caption은 기본값), motion duration fast 0.14 / base 0.28 / slow 0.55.
- 나머지 값은 `baseTokens` 그대로.

모든 스케일은 기존 규칙(양수, display > h1 > h2 > body > caption)을 만족한다.

## 5. 갤러리

### 5.1 화면
```
테마 갤러리 (13)                                         [선택 해제]
[전체] [논문] [학술] [산뜻] [차분] [화려] [색채] [다크] [미니멀] [비즈니스] [따뜻함]
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 견본      │ │ 견본      │ │ 견본      │ │ 견본      │   ← 해당 테마로 그린 16:9 견본 슬라이드
│ thesis ✓ │ │ paper    │ │ mint   ✓ │ │ slate    │   ← 이름 (✓ = 선택됨)
│ 논문 학술 │ │ 학술 차분 │ │ 산뜻 색채 │ │ 비즈니스  │   ← 태그 (누르면 그 태그로 필터)
└──────────┘ └──────────┘ └──────────┘ └──────────┘
── 선택한 테마 상세 (thesis · mint) ─────────────
[thesis 상세]          [mint 상세]                     ← 1개면 전체 폭, 2~3개면 나란히
```

### 5.2 동작
- **태그 필터**: 한 번에 하나. "전체"는 필터 해제. 카드의 태그 칩을 눌러도 그 태그로 필터된다. 필터는 그리드에만 적용되며 선택 상태는 유지된다.
- **선택**: 카드를 누르면 선택/해제를 전환한다. 최대 3개이며, 4번째를 선택하면 가장 먼저 선택한 것이 빠진다. "선택 해제"는 모두 해제한다.
- **상세**: 선택 순서대로 기존 `ThemeColumn`을 보여 준다. 상세에는 설명·태그·사용 글꼴이 추가되고, 타입 스펙시먼은 테마의 실제 글꼴(제목 단계는 display, 나머지는 sans)로 렌더한다.
- **URL 상태**: `?tag=<태그>&sel=<이름>,<이름>`. 새로고침·북마크 시 복원된다. 모르는 태그·테마 이름, 중복, 3개 초과는 무시·정리한다. 상태가 바뀌면 `history.replaceState`로 갱신한다(기록을 쌓지 않음).
- 카드가 0개인 경우는 규칙상(§6) 생기지 않지만, 생기면 "이 태그의 테마가 없습니다"를 표시한다.

### 5.3 코드 구조
| 파일 | 역할 |
|---|---|
| `src/gallery/query.ts` | 순수 로직: `filterThemes`, `parseGalleryQuery`, `formatGalleryQuery`, `toggleSelection` |
| `src/gallery/GalleryApp.tsx` | 클라이언트: 필터 바, 카드 그리드, 선택 영역, URL 동기화 |
| `src/gallery/ThemeCard.tsx` | 견본 썸네일, 이름, 태그 칩, 선택 표시 |
| `src/gallery/ThemeColumn.tsx` | 기존 상세 (설명·태그·글꼴 추가, 스펙시먼 글꼴 적용) |
| `src/app/gallery/page.dev.tsx` | `GalleryApp`만 렌더 |

`page.dev.tsx` 확장자 규칙은 그대로라 프로덕션 빌드에 포함되지 않는다.

## 6. 규칙과 테스트

### 6.1 단위 테스트로 강제하는 규칙
- 모든 테마: 태그 1~3개, 모두 `THEME_TAGS` 소속, 중복 없음, `description` 비어 있지 않음.
- 모든 태그: 2개 이상의 테마가 사용.
- 모든 테마의 `font.*` 스택이 참조하는 `--font-<이름>` 변수는 `src/fonts`에 등록된 글꼴이다(`src/themes/fonts.ts`의 스택만 사용).
- 기존 규칙을 13개 전부에 적용: `fg/bg`, `muted/bg`, `fg/surface`, `accentFg/accent` 대비 4.5:1 이상, 두 캔버스 타입 스케일 양수·내림차순, gap 6단계 오름차순.
- `defineTheme` 병합: 지정한 하위 키만 바뀌고 나머지는 기본값, 배열은 교체.
- 갤러리 로직: 필터, URL 왕복, 잘못된 값 무시, 선택 3개 제한과 가장 오래된 것 제거.

### 6.2 그 밖의 검증
- 프로덕션 제외: 기존 E2E(`/gallery/` → 404)와 빌드 후 `out/gallery` 부재 확인.
- 시각 확인: 개발 모드에서 13개 테마를 갤러리로 직접 훑어본다(색감·글꼴의 적절성은 사람이 판단).
- 기존 덱·E2E·PDF는 테마 이름과 외형이 그대로라 변경 없이 통과해야 한다.

## 7. 문서
`CLAUDE.md`:
- 매니페스트에 새 글꼴 행 추가, "마지막 검증" 갱신.
- "테마 추가" 레시피를 `defineTheme`, 태그 규칙(1~3개, 태그당 2개 이상), 글꼴 선택(`src/themes/fonts.ts` 스택만 사용) 중심으로 갱신.
- 태그 목록과 13개 테마 요약(이름·태그·한 줄 설명) 표.
