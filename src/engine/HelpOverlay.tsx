"use client";

const SHORTCUTS: [string, string][] = [
  ["→ · Space · PgDn · 오른쪽 탭", "다음"],
  ["← · Shift+Space · PgUp · 왼쪽 탭", "이전"],
  ["Home / End", "처음 / 끝"],
  ["F", "전체화면"],
  ["M", "발표 ↔ 읽기 모드"],
  ["?", "이 도움말"],
];

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="단축키"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="max-w-md rounded-xl bg-white p-6 text-neutral-900 shadow-xl">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="contents">
              <dt className="font-mono text-neutral-600">{keys}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-neutral-500">아무 키나 누르거나 화면을 누르면 닫힙니다</p>
      </div>
    </div>
  );
}
