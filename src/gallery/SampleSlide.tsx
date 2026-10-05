import { Slide, Step } from "@/engine";

/** 테마가 어떻게 보이는지 확인하는 견본. 레이아웃 템플릿이 아니다. */
export function SampleSlide() {
  return (
    <Slide className="flex flex-col justify-between">
      <div className="flex flex-col gap-s3">
        <p className="text-caption text-muted">견본 · Sample</p>
        <h1 className="font-display text-h1 font-bold tracking-tight">테마가 적용된 슬라이드</h1>
      </div>
      <div className="flex flex-row gap-s4 portrait:flex-col">
        <Step className="flex-1 rounded-theme border border-border bg-surface p-s4">
          <p className="text-h2 font-bold">본문 카드</p>
          <p className="text-muted">설명 문장입니다. The quick brown fox.</p>
        </Step>
        <Step className="flex-1 rounded-theme bg-accent p-s4 text-accent-fg">
          <p className="text-h2 font-bold">강조 카드</p>
          <p>accent / accent-fg</p>
        </Step>
      </div>
    </Slide>
  );
}
