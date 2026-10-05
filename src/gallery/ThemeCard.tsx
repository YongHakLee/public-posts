"use client";

import { StaticSlideFrame } from "@/engine";
import { cn } from "@/lib/cn";
import { themes, type ThemeName } from "@/themes";
import type { ThemeTag } from "@/themes/types";
import { SampleSlide } from "./SampleSlide";

type ThemeCardProps = {
  name: ThemeName;
  selected: boolean;
  onToggle: () => void;
  onTag: (tag: ThemeTag) => void;
};

export function ThemeCard({ name, selected, onToggle, onTag }: ThemeCardProps) {
  const theme = themes[name];
  return (
    <article
      data-theme-card={name}
      data-selected={selected}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm",
        selected ? "border-neutral-900" : "border-transparent",
      )}
    >
      {/* 썸네일 클릭은 마우스용 지름길. 키보드는 아래 선택 버튼을 쓴다. */}
      <div className="cursor-pointer" onClick={onToggle} aria-hidden>
        <StaticSlideFrame canvas="landscape" theme={name}>
          <SampleSlide />
        </StaticSlideFrame>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-bold">
            {theme.label} <code className="text-xs font-normal text-neutral-500">{name}</code>
          </h3>
          <button
            type="button"
            aria-pressed={selected}
            onClick={onToggle}
            className={cn(
              "shrink-0 rounded-md border px-2 py-0.5 text-xs",
              selected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300",
            )}
          >
            {selected ? "선택됨 ✓" : "선택"}
          </button>
        </div>
        <p className="text-xs text-neutral-600">{theme.description}</p>
        <div className="flex flex-wrap gap-1">
          {theme.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTag(tag)}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs hover:bg-neutral-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
