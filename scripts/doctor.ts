import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import {
  checkFonts,
  checkManifest,
  checkRequired,
  compareVersion,
  parseManifest,
  type CheckResult,
  type FontEntry,
  type SourceReader,
} from "./lib/manifest";

const read: SourceReader = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);

function runningNpmVersion(): string {
  const fromAgent = /npm\/(\S+)/.exec(process.env.npm_config_user_agent ?? "")?.[1];
  return fromAgent ?? execSync("npm --version", { encoding: "utf8" }).trim();
}

function manifestChecks(): CheckResult[] {
  const claude = read("CLAUDE.md");
  if (claude === null) return [{ ok: false, label: "CLAUDE.md", detail: "파일이 없습니다" }];
  try {
    const rows = parseManifest(claude);
    return [...checkRequired(rows), ...checkManifest(rows, read)];
  } catch (error) {
    return [{ ok: false, label: "매니페스트", detail: (error as Error).message }];
  }
}

function fontChecks(): CheckResult[] {
  const fonts = JSON.parse(read("src/fonts/fonts.json") ?? "[]") as FontEntry[];
  return checkFonts(fonts, (file) => existsSync(join("src/fonts", file)));
}

function environmentChecks(): CheckResult[] {
  const nvmrc = (read(".nvmrc") ?? "").trim();
  const packageManager = (JSON.parse(read("package.json") ?? "{}") as { packageManager?: string }).packageManager ?? "";
  const chromiumPath = chromium.executablePath();
  return [
    compareVersion("Node", process.versions.node, nvmrc),
    compareVersion("npm", runningNpmVersion(), packageManager.split("@")[1] ?? ""),
    existsSync(chromiumPath)
      ? { ok: true, label: "Playwright Chromium 설치됨" }
      : { ok: false, label: "Playwright Chromium", detail: "없음 → npx playwright install --with-deps chromium" },
  ];
}

const manifestOnly = process.argv.includes("--manifest-only");
const results = [...manifestChecks(), ...fontChecks(), ...(manifestOnly ? [] : environmentChecks())];

for (const result of results) {
  console.log(result.ok ? `✓ ${result.label}` : `✗ ${result.label} — ${result.detail}`);
}
const failed = results.filter((result) => !result.ok).length;
console.log(failed === 0 ? "\n환경이 매니페스트와 일치합니다." : `\n${failed}개 항목이 일치하지 않습니다.`);
process.exit(failed === 0 ? 0 : 1);
