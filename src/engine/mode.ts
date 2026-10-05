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
