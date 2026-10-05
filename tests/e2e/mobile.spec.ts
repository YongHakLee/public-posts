import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

const DECK = sitePath("/decks/hello/");

test("세로 화면은 4:5 읽기 모드로 열고 모든 스텝을 보여준다", async ({ page }) => {
  await page.goto(DECK);
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "read");
  const slides = page.locator("[data-slide-index]");
  await expect(slides).toHaveCount(4);
  await expect(slides.first()).toHaveAttribute("data-canvas", "portrait");
  await expect(page.locator('[data-step][data-visible="false"]')).toHaveCount(0);
});

test("스크롤 위치가 해시에 반영되고, 가로로 돌려도 같은 슬라이드다", async ({ page }) => {
  await page.goto(DECK);
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "read");
  await page.locator('[data-card="2"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
  await expect(page).toHaveURL(/#3$/);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("[data-deck]")).toHaveAttribute("data-mode", "present");
  await expect(page.locator('[data-slide-index][data-active="true"]')).toHaveAttribute("data-slide-index", "3");
});

test("딥링크 해시로 해당 카드까지 스크롤한다", async ({ page }) => {
  await page.goto(`${DECK}#4`);
  await expect(page.locator('[data-card="3"]')).toBeInViewport();
  await expect(page).toHaveURL(/#4$/);
});
