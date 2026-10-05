import { describe, expect, it } from "vitest";
import {
  MANIFEST_END,
  MANIFEST_START,
  checkFonts,
  checkManifest,
  checkRequired,
  compareVersion,
  parseManifest,
  resolveLocator,
  type SourceReader,
} from "../../scripts/lib/manifest";

const doc = `# 제목

${MANIFEST_START}
| 항목 | 버전 | 출처 | 재현 방법 |
|---|---|---|---|
| Node.js | 24.18.0 | \`.nvmrc\` | \`nvm install\` |
| npm | 11.16.0 | \`package.json#packageManager\` | \`npm i -g npm@11.16.0\` |
| next | 16.3.8 | \`package-lock.json#next\` | \`npm ci\` |
| Chromium (Playwright) | 1.63.0 | \`package-lock.json#@playwright/test\` | \`npx playwright install --with-deps chromium\` |
| Pretendard | 1.3.9 | \`src/fonts/fonts.json#Pretendard\` | Git에 포함 |
${MANIFEST_END}

나머지 내용
`;

const files: Record<string, string> = {
  ".nvmrc": "24.18.0\n",
  "package.json": JSON.stringify({ packageManager: "npm@11.16.0" }),
  "package-lock.json": JSON.stringify({
    packages: { "node_modules/next": { version: "16.3.8" }, "node_modules/@playwright/test": { version: "1.63.0" } },
  }),
  "src/fonts/fonts.json": JSON.stringify([{ family: "Pretendard", version: "1.3.9" }]),
};
const read: SourceReader = (path) => files[path] ?? null;

describe("parseManifest", () => {
  it("표시 사이의 표를 행으로 읽는다", () => {
    const rows = parseManifest(doc);
    expect(rows).toHaveLength(5);
    expect(rows[3]).toEqual({ name: "Chromium (Playwright)", version: "1.63.0", locator: "package-lock.json#@playwright/test" });
  });
  it("표시가 없으면 예외", () => {
    expect(() => parseManifest("# 없음")).toThrow(/manifest/);
  });
  it("출처에 백틱 로케이터가 없으면 예외", () => {
    const bad = `${MANIFEST_START}\n| a | b | c | d |\n|---|---|---|---|\n| x | 1.0.0 | 없음 | - |\n${MANIFEST_END}`;
    expect(() => parseManifest(bad)).toThrow(/x/);
  });
});

describe("resolveLocator", () => {
  it("각 출처에서 실제 버전을 읽는다", () => {
    expect(resolveLocator(".nvmrc", read)).toBe("24.18.0");
    expect(resolveLocator("package.json#packageManager", read)).toBe("11.16.0");
    expect(resolveLocator("package-lock.json#next", read)).toBe("16.3.8");
    expect(resolveLocator("package-lock.json#@playwright/test", read)).toBe("1.63.0");
    expect(resolveLocator("src/fonts/fonts.json#Pretendard", read)).toBe("1.3.9");
  });
  it(".nvmrc의 v 접두어는 무시", () => {
    expect(resolveLocator(".nvmrc", () => "v24.18.0")).toBe("24.18.0");
  });
  it("모르는 로케이터·없는 파일·없는 패키지는 null", () => {
    expect(resolveLocator("README.md", read)).toBeNull();
    expect(resolveLocator("package-lock.json#nope", read)).toBeNull();
    expect(resolveLocator(".nvmrc", () => null)).toBeNull();
  });
});

describe("checkManifest", () => {
  it("모두 일치하면 ok", () => {
    expect(checkManifest(parseManifest(doc), read).every((r) => r.ok)).toBe(true);
  });
  it("불일치는 문서값과 실제값을 보여준다", () => {
    const stale = doc.replace("| next | 16.3.8 |", "| next | 16.0.0 |");
    const failed = checkManifest(parseManifest(stale), read).filter((r) => !r.ok);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.detail).toContain("16.0.0");
    expect(failed[0]?.detail).toContain("16.3.8");
  });
});

describe("checkRequired", () => {
  it("필수 행이 빠지면 실패", () => {
    const rows = parseManifest(doc).filter((r) => r.locator !== ".nvmrc");
    const failed = checkRequired(rows).filter((r) => !r.ok);
    expect(failed.map((r) => r.label).join()).toContain(".nvmrc");
  });
});

describe("checkFonts", () => {
  const entry = { family: "Pretendard", version: "1.3.9", file: "a.woff2", license: "OFL-1.1", licenseFile: "L.txt" };
  it("폰트와 라이선스 파일이 있어야 한다", () => {
    expect(checkFonts([entry], () => true).every((r) => r.ok)).toBe(true);
    expect(checkFonts([entry], (f) => f !== "L.txt").filter((r) => !r.ok)).toHaveLength(1);
  });
});

describe("compareVersion", () => {
  it("일치 여부", () => {
    expect(compareVersion("Node", "24.18.0", "24.18.0").ok).toBe(true);
    expect(compareVersion("Node", "24.11.0", "24.18.0")).toEqual({
      ok: false,
      label: "Node",
      detail: "실행 중 24.11.0 ≠ 고정값 24.18.0",
    });
  });
});
