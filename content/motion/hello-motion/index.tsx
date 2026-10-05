import { stagger, type AnimationSequence } from "motion/react";
import { MotionStage } from "@/engine";
import type { Theme } from "@/themes/types";

const WORDS = ["웹에서", "움직이는", "이야기"];

function sequence(theme: Theme): AnimationSequence {
  const ease = theme.motion.easing.emphasized;
  return [
    [".hm-word", { opacity: [0, 1], y: [60, 0] }, { duration: theme.motion.duration.slow, ease, delay: stagger(0.12) }],
    [".hm-bar", { scaleX: [0, 1] }, { duration: theme.motion.duration.slow, ease, at: "-0.2" }],
    [".hm-caption", { opacity: [0, 1] }, { duration: theme.motion.duration.base }],
  ];
}

export default function HelloMotion() {
  return (
    <MotionStage aspect="16:9" loop sequence={sequence}>
      <div className="flex h-full flex-col justify-center gap-s4 p-canvas">
        <h1 className="flex gap-s3 font-display text-display font-extrabold tracking-tight">
          {WORDS.map((word) => (
            <span key={word} className="hm-word inline-block opacity-0">
              {word}
            </span>
          ))}
        </h1>
        {/* Tailwind scale-x-* 클래스는 CSS scale 속성을 써서 Motion의 transform과 겹치므로 인라인으로 시작값을 둔다 */}
        <div className="hm-bar h-3 w-[60%] origin-left bg-fg" style={{ transform: "scaleX(0)" }} />
        <p className="hm-caption text-h2 text-muted opacity-0">public-posts · motion</p>
      </div>
    </MotionStage>
  );
}
