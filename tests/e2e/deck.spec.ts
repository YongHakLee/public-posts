import { expect, test, type Page } from "@playwright/test";
import { sitePath } from "./helpers";

const DECK = sitePath("/decks/hello/");
const activeSlide = (page: Page) => page.locator('[data-slide-index][data-active="true"]');
const visibleSteps = (page: Page, slide: number) =>
  page.locator(`[data-slide-index="${slide}"] [data-step][data-visible="true"]`);

async function openDeck(page: Page, hash = "") {
  await page.goto(DECK + hash);
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "present");
}

test("키보드로 슬라이드와 스텝을 넘긴다", async ({ page }) => {
  await openDeck(page);
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "1");
  await expect(page).toHaveURL(/#1$/);

  await page.keyboard.press("ArrowRight");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "2");
  await expect(visibleSteps(page, 2)).toHaveCount(0);

  await page.keyboard.press("ArrowRight");
  await expect(visibleSteps(page, 2)).toHaveCount(1);
  await page.keyboard.press("Space");
  await page.keyboard.press("PageDown");
  await expect(visibleSteps(page, 2)).toHaveCount(3);

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#3$/);

  await page.keyboard.press("ArrowLeft");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "2");
  await expect(visibleSteps(page, 2)).toHaveCount(3);

  await page.keyboard.press("End");
  await expect(page).toHaveURL(/#4$/);
  await page.keyboard.press("Home");
  await expect(page).toHaveURL(/#1$/);
});

test("해시로 특정 슬라이드를 연다", async ({ page }) => {
  await openDeck(page, "#3");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "3");
});

test("범위 밖·잘못된 해시는 보정된다", async ({ page }) => {
  await openDeck(page, "#99");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "4");
  await expect(page).toHaveURL(/#4$/);

  await openDeck(page, "#abc");
  await expect(activeSlide(page)).toHaveAttribute("data-slide-index", "1");
  await expect(page).toHaveURL(/#1$/);
});

test("화면 오른쪽/왼쪽 클릭으로 넘긴다", async ({ page }) => {
  await openDeck(page);
  await page.mouse.click(1200, 450);
  await expect(page).toHaveURL(/#2$/);
  await page.mouse.click(200, 450);
  await expect(page).toHaveURL(/#1$/);
});

test("M 키로 읽기 모드와 발표 모드를 오간다", async ({ page }) => {
  await openDeck(page, "#2");
  await page.keyboard.press("m");
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "read");
  await expect(page.locator('[data-slide-index="1"]')).toHaveAttribute("data-canvas", "landscape");
  await page.keyboard.press("m");
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "present");
});

test("? 키로 도움말을 열고 아무 키로 닫는다", async ({ page }) => {
  await openDeck(page);
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "단축키" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#1$/);
});
