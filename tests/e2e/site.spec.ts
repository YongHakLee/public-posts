import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

test("홈이 basePath 아래에서 열린다", async ({ page }) => {
  const res = await page.goto(sitePath("/"));
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "public-posts" })).toBeVisible();
});
