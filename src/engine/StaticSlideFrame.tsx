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
