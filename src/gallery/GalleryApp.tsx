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
