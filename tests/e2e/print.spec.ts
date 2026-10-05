import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

test("인쇄 모드: landscape 캔버스로 모든 슬라이드와 스텝을 펼친다", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(sitePath("/decks/hello/?print"));
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "print");

  const slides = page.locator("[data-slide-index]");
  await expect(slides).toHaveCount(4);
  const sizes = await slides.evaluateAll((els) => els.map((el) => [el.clientWidth, el.clientHeight]));
  expect(sizes).toEqual(Array(4).fill([1920, 1080]));
  await expect(page.locator('[data-step][data-visible="false"]')).toHaveCount(0);
  await expect(page.locator('[data-overflow="true"]')).toHaveCount(0);
});

test("portrait 인쇄 검사 모드는 1080×1350 캔버스", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.goto(sitePath("/decks/hello/?print&canvas=portrait"));
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  const slides = page.locator("[data-slide-index]");
  await expect(slides.first()).toHaveAttribute("data-canvas", "portrait");
  const sizes = await slides.evaluateAll((els) => els.map((el) => [el.clientWidth, el.clientHeight]));
  expect(sizes).toEqual(Array(4).fill([1080, 1350]));
  await expect(page.locator('[data-overflow="true"]')).toHaveCount(0);
});
