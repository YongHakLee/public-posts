import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FONT_REGISTRY, familyForStack } from "@/fonts/registry";
import { FONT_STACKS, MONO_STACK } from "@/themes/fonts";

type FontJson = { family: string; version: string; file: string; license: string; licenseFile: string };
const fontsJson = JSON.parse(readFileSync("src/fonts/fonts.json", "utf8")) as FontJson[];
const indexSource = readFileSync("src/fonts/index.ts", "utf8");
const registeredVariables = FONT_REGISTRY.map((font) => font.cssVariable);

describe("글꼴 레지스트리", () => {
  it("fonts.json과 같은 글꼴 목록", () => {
    expect(FONT_REGISTRY.map((font) => font.family).toSorted()).toEqual(fontsJson.map((font) => font.family).toSorted());
  });

  it.each(fontsJson)("$family: 글꼴·라이선스 파일이 있다", (font) => {
    expect(existsSync(join("src/fonts", font.file))).toBe(true);
    expect(existsSync(join("src/fonts", font.licenseFile))).toBe(true);
  });

  it("src/fonts/index.ts가 같은 CSS 변수를 선언한다", () => {
    const declared = [...indexSource.matchAll(/variable:\s*"(--font-[a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(declared.toSorted()).toEqual(registeredVariables.toSorted());
  });

  it("Pretendard 외 글꼴은 preload하지 않는다", () => {
    expect(indexSource.match(/preload:\s*false/g)).toHaveLength(FONT_REGISTRY.length - 1);
  });
});

describe("글꼴 스택", () => {
  it.each(Object.entries(FONT_STACKS))("%s 스택은 등록된 글꼴 변수로 시작한다", (_, stack) => {
    const variable = /^var\((--font-[a-z0-9-]+)\)/.exec(stack)?.[1];
    expect(registeredVariables).toContain(variable);
  });

  it.each(Object.entries(FONT_STACKS))("%s 스택의 모든 var(--font-*)가 등록돼 있다 (하나라도 없으면 스택 전체가 무효)", (_, stack) => {
    const used = [...stack.matchAll(/var\((--font-[a-z0-9-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const variable of used) expect(registeredVariables).toContain(variable);
  });

  it("fontVariables가 선언한 글꼴을 모두 포함한다 (빠지면 <html>에 변수가 정의되지 않음)", () => {
    const declared = [...indexSource.matchAll(/export const (\w+) = localFont\(/g)].map((m) => m[1]);
    const listed = /fontVariables = \[([^\]]*)\]/.exec(indexSource)?.[1]?.split(",").map((name) => name.trim()) ?? [];
    expect(declared.length).toBe(FONT_REGISTRY.length);
    expect(listed.toSorted()).toEqual(declared.toSorted());
  });

  it("familyForStack은 등록된 글꼴 이름을 돌려준다", () => {
    expect(familyForStack(FONT_STACKS.sans)).toBe("Pretendard");
    expect(familyForStack(FONT_STACKS.serif)).toBe("Hahmlet");
    expect(familyForStack(FONT_STACKS.display)).toBe("Black Han Sans");
  });

  it("등록되지 않은 스택은 첫 글꼴 이름", () => {
    expect(familyForStack(MONO_STACK)).toBe("ui-monospace");
    expect(familyForStack('"Some Font", serif')).toBe("Some Font");
  });
});
