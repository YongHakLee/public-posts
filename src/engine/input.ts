export type KeyInput = {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type Command = "next" | "prev" | "first" | "last" | "fullscreen" | "mode" | "help" | "close";

const isAsciiLetter = (key: string) => /^[a-z]$/i.test(key);

/**
 * 글자 단축키 판단: key가 ASCII 글자면 key로 (AZERTY·Dvorak 등 비QWERTY 배열에서도 글자 그대로 동작).
 * key가 ASCII 글자가 아닐 때만(한글 'ㄹ', IME 'Process' 등) 물리 키 code로 되돌아간다.
 * 단축키가 아닌 ASCII 글자는 code로 되돌아가지 않는다.
 */
function letterOf(e: KeyInput): string | null {
  if (isAsciiLetter(e.key)) return e.key.toLowerCase();
  const match = /^Key([A-Z])$/.exec(e.code);
  return match ? match[1].toLowerCase() : null;
}

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
  switch (letterOf(e)) {
    case "f":
      return "fullscreen";
    case "m":
      return "mode";
  }
  if (e.code === "Slash" && e.shiftKey) return "help";
  return null;
}

export type StageCommand = "toggle" | "restart";

export function stageKeyToCommand(e: KeyInput): StageCommand | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === " " || e.code === "Space") return "toggle";
  if (letterOf(e) === "r") return "restart";
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
