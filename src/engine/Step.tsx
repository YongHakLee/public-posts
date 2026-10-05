"use client";

import { motion } from "motion/react";
import { useContext, useId, type ReactNode } from "react";
import { useTheme } from "@/themes/ThemeScope";
import { STEP_VARIANTS, type StepEffect } from "./effects";
import { StepOrderContext, useSlideSlot } from "./slide-context";

export type StepProps = {
  children: ReactNode;
  /** 생략하면 문서 순서. 같은 값이면 함께 등장. */
  order?: number;
  effect?: StepEffect;
  className?: string;
};

export function Step({ children, order, effect = "fade", className }: StepProps) {
  const id = useId();
  const slot = useSlideSlot();
  const orders = useContext(StepOrderContext);
  const theme = useTheme();
  const resolved = orders[id];
  const visible = slot.showAll || (resolved !== undefined && resolved <= slot.revealed);

  return (
    <motion.div
      data-step={id}
      data-order={order}
      data-visible={visible}
      className={className}
      initial={false}
      variants={STEP_VARIANTS[effect]}
      animate={visible ? "shown" : "hidden"}
      transition={{ duration: theme.motion.duration.base, ease: theme.motion.easing.emphasized }}
    >
      {children}
    </motion.div>
  );
}
