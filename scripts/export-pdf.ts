import { join } from "node:path";
import { chromium, type Browser } from "@playwright/test";
import { works } from "@content/registry";
import { CANVAS_SIZE } from "@/engine/canvas";
import type { Canvas } from "@/themes/types";
import { BASE_PATH } from "../site.config";
import { formatFailures, pdfTargets, printUrl, type OverflowFailure, type PdfTarget } from "./lib/pdf-targets";
import { startServer } from "./lib/serve";

const OUT = "out";
const READY_TIMEOUT = 30_000;
// 덱마다 portrait → landscape 순으로 검사한다. landscape PDF는 landscape가 넘치지 않을 때만 쓰이므로,
// portrait에서만 넘쳐도 PDF 파일은 만들어지지만 아래에서 실패로 종료한다 (배포 중단).
const CANVAS_ORDER: Canvas[] = ["portrait", "landscape"];

async function render(browser: Browser, siteUrl: string, target: PdfTarget, canvas: Canvas): Promise<number[]> {
  const page = await browser.newPage({ viewport: CANVAS_SIZE[canvas] });
  try {
    await page.goto(printUrl(siteUrl, target, canvas), { waitUntil: "networkidle" });
    await page.waitForSelector('html[data-ready="true"]', { timeout: READY_TIMEOUT });
    const overflow = await page.$$eval('[data-slide-index][data-overflow="true"]', (els) =>
      els.map((el) => Number((el as HTMLElement).dataset.slideIndex)),
    );
    if (overflow.length === 0 && canvas === "landscape") {
      const { width, height } = CANVAS_SIZE.landscape;
      await page.pdf({
        path: join(OUT, target.outFile),
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        preferCSSPageSize: true,
      });
      console.log(`✓ ${target.outFile}`);
    }
    return overflow;
  } catch (error) {
    throw new Error(`${target.slug} [${canvas}] 렌더링 실패: ${(error as Error).message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const targets = pdfTargets(works);
  const server = await startServer({ root: OUT, basePath: BASE_PATH, port: 0 });
  const browser = await chromium.launch();
  const failures: OverflowFailure[] = [];
  try {
    for (const target of targets) {
      for (const canvas of CANVAS_ORDER) {
        const slides = await render(browser, server.url, target, canvas);
        if (slides.length > 0) failures.push({ slug: target.slug, canvas, slides });
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (failures.length > 0) {
    console.error(`캔버스 오버플로가 있습니다 (배포 중단):\n${formatFailures(failures)}`);
    process.exit(1);
  }
  console.log(`PDF ${targets.length}개 생성 완료`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
