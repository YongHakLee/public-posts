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
