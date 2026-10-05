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
