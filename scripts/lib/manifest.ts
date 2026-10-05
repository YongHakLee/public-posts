export const MANIFEST_START = "<!-- manifest:start -->";
export const MANIFEST_END = "<!-- manifest:end -->";

export type ManifestRow = { name: string; version: string; locator: string };
export type SourceReader = (path: string) => string | null;
export type CheckResult = { ok: boolean; label: string; detail?: string };
export type FontEntry = { family: string; version: string; file: string; license: string; licenseFile: string };

/** 이 출처들은 매니페스트에서 빠지면 안 된다 */
export const REQUIRED_LOCATORS = [".nvmrc", "package.json#packageManager", "package-lock.json#next", "package-lock.json#@playwright/test"];

export function parseManifest(markdown: string): ManifestRow[] {
  const start = markdown.indexOf(MANIFEST_START);
  const end = markdown.indexOf(MANIFEST_END);
  if (start < 0 || end < start) {
    throw new Error(`CLAUDE.md에 manifest 표시(${MANIFEST_START} … ${MANIFEST_END})가 없습니다`);
  }
  const lines = markdown
    .slice(start + MANIFEST_START.length, end)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  // 머리글 행과 구분선을 건너뛴다. 칸 안에는 '|'를 쓰지 않는다.
  return lines.slice(2).map((line) => {
    const [name, version, source] = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const locator = /`([^`]+)`/.exec(source ?? "")?.[1];
    if (!name || !version || !locator) throw new Error(`매니페스트 행을 해석할 수 없습니다: ${line}`);
    return { name, version, locator };
  });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function resolveLocator(locator: string, read: SourceReader): string | null {
  const [path, key] = locator.split("#") as [string, string | undefined];
  const text = read(path);
  if (text === null) return null;

  if (path === ".nvmrc" && !key) return text.trim().replace(/^v/, "") || null;
  if (path === "package.json" && key === "packageManager") {
    const value = (parseJson(text) as { packageManager?: string } | null)?.packageManager;
    return value?.split("@")[1] ?? null;
  }
  if (path === "package-lock.json" && key) {
    const lock = parseJson(text) as { packages?: Record<string, { version?: string }> } | null;
    return lock?.packages?.[`node_modules/${key}`]?.version ?? null;
  }
  if (path.endsWith("fonts.json") && key) {
    const fonts = parseJson(text) as Pick<FontEntry, "family" | "version">[] | null;
    return fonts?.find((font) => font.family === key)?.version ?? null;
  }
  return null;
}

export function checkManifest(rows: readonly ManifestRow[], read: SourceReader): CheckResult[] {
  return rows.map((row) => {
    const actual = resolveLocator(row.locator, read);
    if (actual === null) return { ok: false, label: row.name, detail: `출처 \`${row.locator}\`에서 버전을 읽을 수 없습니다` };
    if (actual !== row.version) {
      return { ok: false, label: row.name, detail: `문서 ${row.version} ≠ 실제 ${actual} (${row.locator})` };
    }
    return { ok: true, label: `${row.name} ${row.version}` };
  });
}

export function checkRequired(rows: readonly ManifestRow[]): CheckResult[] {
  const present = new Set(rows.map((row) => row.locator));
  return REQUIRED_LOCATORS.map((locator) =>
    present.has(locator)
      ? { ok: true, label: `필수 행 ${locator}` }
      : { ok: false, label: `필수 행 ${locator}`, detail: "매니페스트 표에 이 출처의 행이 없습니다" },
  );
}

export function checkFonts(entries: readonly FontEntry[], exists: (fileName: string) => boolean): CheckResult[] {
  return entries.flatMap((font) =>
    [font.file, font.licenseFile].map((file) =>
      exists(file)
        ? { ok: true, label: `폰트 파일 ${file}` }
        : { ok: false, label: `폰트 파일 ${file}`, detail: `src/fonts/${file}가 없습니다 (${font.family})` },
    ),
  );
}

export function compareVersion(label: string, actual: string, expected: string): CheckResult {
  return actual === expected
    ? { ok: true, label: `${label} ${actual}` }
    : { ok: false, label, detail: `실행 중 ${actual} ≠ 고정값 ${expected}` };
}
