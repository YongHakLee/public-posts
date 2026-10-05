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
