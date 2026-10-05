"use client";

import {
  useAnimate,
  useInView,
  useReducedMotion,
  type AnimationPlaybackControls,
  type AnimationSequence,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/themes/ThemeScope";
import type { Theme } from "@/themes/types";
import { STAGE_SIZE, type StageAspect } from "./canvas";
import { isEditableTarget } from "./dom";
import { stageKeyToCommand } from "./input";
import { ScaledCanvas } from "./ScaledCanvas";

export type MotionStageProps = {
  aspect?: StageAspect;
  loop?: boolean;
  /** 셀렉터는 스테이지 안에서만 찾는다. 다시 재생이 가능하도록 키프레임은 시작값부터 적는다 (예: opacity: [0, 1]). */
  sequence: (theme: Theme) => AnimationSequence;
  className?: string;
  children: ReactNode;
};

/**
 * 독립 모션 작품용 고정 캔버스. 화면에 보이면 재생, 클릭/Space로 일시정지·재개, R로 처음부터.
 * prefers-reduced-motion이면 재생하지 않고 최종 상태를 보여준다.
 */
export function MotionStage({ aspect = "16:9", loop = false, sequence, className, children }: MotionStageProps) {
  const theme = useTheme();
  const reduce = useReducedMotion() ?? false;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { amount: 0.5 });
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const playing = inView && !paused && !reduce;

  const create = useEffectEvent(() => {
    const repeat = loop && !reduce ? Number.POSITIVE_INFINITY : 0;
    const created = animate(sequence(theme), { repeat, repeatDelay: repeat ? 1 : 0 });
    created.pause();
    if (reduce) created.complete();
    return created;
  });

  useEffect(() => {
    const created = create();
    controls.current = created;
    return () => {
      created.stop();
      controls.current = null;
    };
  }, [run]);

  useEffect(() => {
    const current = controls.current;
    if (!current) return;
    if (playing) current.play();
    else current.pause();
  }, [playing, run]);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return;
    const command = stageKeyToCommand(event);
    if (!command) return;
    event.preventDefault();
    if (command === "toggle") {
      setPaused((p) => !p);
    } else {
      setPaused(false);
      setRun((r) => r + 1);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <div
      data-motion-stage=""
      data-playing={playing}
      className={cn("fixed inset-0 overflow-hidden bg-bg", className)}
      onClick={() => setPaused((p) => !p)}
    >
      <ScaledCanvas size={STAGE_SIZE[aspect]} fit="contain">
        <div
          ref={scope}
          data-canvas={aspect === "16:9" ? "landscape" : "portrait"}
          className="relative h-full w-full overflow-hidden bg-bg font-sans text-fg"
        >
          {children}
        </div>
      </ScaledCanvas>
    </div>
  );
}
