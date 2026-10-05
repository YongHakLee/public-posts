import { describe, expect, it } from "vitest";
import { gestureToCommand, keyToCommand, stageKeyToCommand, type KeyInput } from "@/engine/input";

const key = (k: string, extra: Partial<KeyInput> = {}): KeyInput => ({
  key: k,
  code: "",
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...extra,
});

describe("keyToCommand", () => {
  it.each([
    ["ArrowRight", "next"],
    ["ArrowDown", "next"],
    ["PageDown", "next"],
    [" ", "next"],
    ["ArrowLeft", "prev"],
    ["ArrowUp", "prev"],
    ["PageUp", "prev"],
    ["Home", "first"],
    ["End", "last"],
    ["?", "help"],
    ["Escape", "close"],
  ])("%s → %s", (k, command) => {
    expect(keyToCommand(key(k))).toBe(command);
  });
  it("Shift+Space는 이전", () => {
    expect(keyToCommand(key(" ", { shiftKey: true }))).toBe("prev");
  });
  it("글자 키는 물리 키(code)로 판단 — 한글 입력 상태에서도 동작", () => {
    expect(keyToCommand(key("f", { code: "KeyF" }))).toBe("fullscreen");
    expect(keyToCommand(key("ㄹ", { code: "KeyF" }))).toBe("fullscreen");
    expect(keyToCommand(key("ㅡ", { code: "KeyM" }))).toBe("mode");
  });
  it("ASCII 글자는 key를 우선한다 — AZERTY·Dvorak 같은 비QWERTY 배열", () => {
    expect(keyToCommand(key("m", { code: "Semicolon" }))).toBe("mode");
    expect(keyToCommand(key("f", { code: "KeyY" }))).toBe("fullscreen");
    expect(keyToCommand(key("F", { code: "KeyF", shiftKey: true }))).toBe("fullscreen");
  });
  it("단축키가 아닌 ASCII 글자는 code로 되돌아가지 않는다", () => {
    expect(keyToCommand(key("a", { code: "KeyF" }))).toBeNull();
    expect(keyToCommand(key("a", { code: "KeyM" }))).toBeNull();
  });
  it("수정 키와 함께면 무시 (브라우저 단축키 보호)", () => {
    expect(keyToCommand(key("ArrowRight", { metaKey: true }))).toBeNull();
    expect(keyToCommand(key("f", { code: "KeyF", ctrlKey: true }))).toBeNull();
  });
  it("모르는 키는 null", () => {
    expect(keyToCommand(key("a", { code: "KeyA" }))).toBeNull();
  });
});

describe("stageKeyToCommand", () => {
  it("Space는 토글, R은 다시 재생 (한글 입력 포함)", () => {
    expect(stageKeyToCommand(key(" ", { code: "Space" }))).toBe("toggle");
    expect(stageKeyToCommand(key("r", { code: "KeyR" }))).toBe("restart");
    expect(stageKeyToCommand(key("ㄱ", { code: "KeyR" }))).toBe("restart");
    expect(stageKeyToCommand(key("x", { code: "KeyX" }))).toBeNull();
  });
  it("비QWERTY 배열: key가 ASCII 글자면 key를 우선한다", () => {
    expect(stageKeyToCommand(key("r", { code: "KeyK" }))).toBe("restart");
    expect(stageKeyToCommand(key("a", { code: "KeyR" }))).toBeNull();
  });
});

describe("gestureToCommand", () => {
  const base = { downX: 500, downY: 300, width: 1000 };
  it("왼쪽으로 스와이프하면 다음", () => {
    expect(gestureToCommand({ ...base, upX: 400, upY: 310 })).toBe("next");
  });
  it("오른쪽으로 스와이프하면 이전", () => {
    expect(gestureToCommand({ ...base, upX: 600, upY: 290 })).toBe("prev");
  });
  it("탭은 화면 절반 기준", () => {
    expect(gestureToCommand({ downX: 800, downY: 300, upX: 802, upY: 301, width: 1000 })).toBe("next");
    expect(gestureToCommand({ downX: 200, downY: 300, upX: 199, upY: 300, width: 1000 })).toBe("prev");
  });
  it("세로 스와이프는 무시", () => {
    expect(gestureToCommand({ ...base, upX: 510, upY: 120 })).toBeNull();
  });
});
