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
