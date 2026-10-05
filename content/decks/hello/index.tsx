import { Deck, Slide, Step } from "@/engine";

const VIEWS: [string, string][] = [
  ["발표", "16:9 전체화면"],
  ["읽기", "모바일 세로 4:5"],
  ["PDF", "주소 끝에 .pdf"],
];

export default function HelloDeck() {
  return (
    <Deck>
      <Slide theme="signal" className="flex flex-col justify-end gap-s3">
        <p className="text-h2 font-bold text-muted">public-posts</p>
        <h1 className="font-display text-display font-extrabold tracking-tight">
          웹에서 만드는
          <br />
          발표 자료와 모션
        </h1>
      </Slide>

      <Slide className="flex flex-col gap-s5">
        <h2 className="text-h1 font-bold tracking-tight">이 덱을 넘기는 법</h2>
        <div className="flex flex-col gap-s3">
          <Step effect="rise">→ · Space · 화면 오른쪽: 다음</Step>
          <Step effect="rise">← · 화면 왼쪽: 이전</Step>
          <Step effect="rise">M 읽기 모드 · F 전체화면 · ? 도움말</Step>
        </div>
      </Slide>

      <Slide className="flex flex-row items-center gap-s6 portrait:flex-col portrait:items-start">
        <h2 className="w-1/2 text-h1 font-bold tracking-tight portrait:w-full">
          하나의 원본,
          <br />
          세 가지 보기
        </h2>
        <div className="flex w-1/2 flex-col gap-s3 portrait:w-full">
          {VIEWS.map(([name, detail]) => (
            <div key={name} className="rounded-theme border border-border bg-surface p-s4">
              <p className="text-caption text-muted">{name}</p>
              <p className="text-h2 font-bold">{detail}</p>
            </div>
          ))}
        </div>
      </Slide>

      <Slide theme="ink" className="flex flex-col items-center justify-center gap-s3 text-center">
        <h2 className="font-display text-display font-extrabold">끝</h2>
        <p className="text-muted">M 키로 읽기 모드 · ? 키로 도움말</p>
      </Slide>
    </Deck>
  );
}
