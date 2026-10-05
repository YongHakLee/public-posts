export type KeyInput = {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type Command = "next" | "prev" | "first" | "last" | "fullscreen" | "mode" | "help" | "close";

/** 글자 단축키는 key가 아닌 code로 판단한다 — 한글 입력 상태에서는 key가 'ㄹ' 등이 되기 때문. */
export function keyToCommand(e: KeyInput): Command | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
    case "PageDown":
      return "next";
    case " ":
      return e.shiftKey ? "prev" : "next";
    case "ArrowLeft":
    case "ArrowUp":
    case "PageUp":
      return "prev";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "?":
      return "help";
    case "Escape":
      return "close";
  }
  switch (e.code) {
    case "KeyF":
      return "fullscreen";
    case "KeyM":
      return "mode";
    case "Slash":
      return e.shiftKey ? "help" : null;
  }
  return null;
}

export type StageCommand = "toggle" | "restart";

export function stageKeyToCommand(e: KeyInput): StageCommand | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === " " || e.code === "Space") return "toggle";
  if (e.code === "KeyR") return "restart";
  return null;
}

export const SWIPE_MIN = 50;

export type Gesture = { downX: number; downY: number; upX: number; upY: number; width: number };

/** 가로 스와이프 → 다음/이전, 탭 → 화면 좌/우 절반, 세로 스와이프 → 무시. */
export function gestureToCommand(g: Gesture): "next" | "prev" | null {
  const dx = g.upX - g.downX;
  const dy = g.upY - g.downY;
  if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "next" : "prev";
  if (Math.abs(dy) >= SWIPE_MIN) return null;
  return g.upX < g.width / 2 ? "prev" : "next";
}
