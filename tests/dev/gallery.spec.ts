import { expect, test, type Page } from "@playwright/test";
import { sitePath } from "../e2e/helpers";

const GALLERY = sitePath("/gallery/");
const cards = (page: Page) => page.locator("[data-theme-card]");
const details = (page: Page) => page.locator("[data-theme-detail]");
const namesOf = (page: Page, selector: string, attribute: string) =>
  page.locator(selector).evaluateAll((els, attr) => els.map((el) => el.getAttribute(attr)), attribute);
const filterButton = (page: Page, label: string) =>
  page.getByRole("navigation", { name: "태그 필터" }).getByRole("button", { name: label, exact: true });
const selectButton = (page: Page, name: string) =>
  page.locator(`[data-theme-card="${name}"]`).getByRole("button", { name: /^선택/ });

test("13개 카드를 보여 주고 태그로 거르며 URL에 반영한다", async ({ page }) => {
  await page.goto(GALLERY);
  await expect(cards(page)).toHaveCount(13);
  await filterButton(page, "논문").click();
  await expect(cards(page)).toHaveCount(2);
  expect(await namesOf(page, "[data-theme-card]", "data-theme-card")).toEqual(["thesis", "journal"]);
  await expect(page).toHaveURL(/\?tag=%EB%85%BC%EB%AC%B8$/);
  await filterButton(page, "전체").click();
  await expect(cards(page)).toHaveCount(13);
});

test("URL에서 상태를 복원하고 잘못된 값은 버린다", async ({ page }) => {
  await page.goto(`${GALLERY}?tag=${encodeURIComponent("없는태그")}&sel=thesis,nope,mint,thesis`);
  await expect(cards(page)).toHaveCount(13);
  await expect(details(page)).toHaveCount(2);
  expect(await namesOf(page, "[data-theme-detail]", "data-theme-detail")).toEqual(["thesis", "mint"]);
  await expect(page).toHaveURL(/\?sel=thesis%2Cmint$/);
});

test("최대 3개 선택, 넷째를 고르면 가장 먼저 고른 것이 빠지고 필터를 바꿔도 선택은 남는다", async ({ page }) => {
  await page.goto(GALLERY);
  for (const name of ["paper", "ink", "signal", "thesis"]) await selectButton(page, name).click();
  await expect(details(page)).toHaveCount(3);
  expect(await namesOf(page, "[data-theme-detail]", "data-theme-detail")).toEqual(["ink", "signal", "thesis"]);

  await filterButton(page, "비즈니스").click();
  await expect(cards(page)).toHaveCount(2);
  await expect(details(page)).toHaveCount(3);

  await page.getByRole("button", { name: "선택 해제" }).click();
  await expect(details(page)).toHaveCount(0);
});

test("카드의 태그를 누르면 그 태그로 거른다", async ({ page }) => {
  await page.goto(GALLERY);
  await page.locator('[data-theme-card="ink"]').getByRole("button", { name: "다크", exact: true }).click();
  await expect(cards(page)).toHaveCount(3);
  expect(await namesOf(page, "[data-theme-card]", "data-theme-card")).toEqual(["ink", "boardroom", "neon"]);
});
