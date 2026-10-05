import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

test("목록 페이지가 공개 작업물을 링크하고 PDF 링크는 없다", async ({ page }) => {
  await page.goto(sitePath("/"));
  await expect(page.getByRole("heading", { level: 1, name: "public-posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: /public-posts 둘러보기/ })).toHaveAttribute("href", sitePath("/decks/hello/"));
  await expect(page.getByRole("link", { name: /움직이는 인사/ })).toHaveAttribute("href", sitePath("/motion/hello-motion/"));
  await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
});

test("작업물 페이지는 작업물별 제목과 OG 메타데이터를 가진다", async ({ page }) => {
  await page.goto(sitePath("/decks/hello/"));
  await expect(page).toHaveTitle("public-posts 둘러보기 · public-posts");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "public-posts 둘러보기");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", "발표·읽기·PDF로 보는 샘플 덱");
});

test("없는 slug는 404 페이지", async ({ page }) => {
  const res = await page.goto(sitePath("/decks/nope/"));
  expect(res?.status()).toBe(404);
  await expect(page.getByText("페이지를 찾을 수 없습니다")).toBeVisible();
});

test("테마 갤러리는 프로덕션 빌드에 없다", async ({ page }) => {
  const res = await page.goto(sitePath("/gallery/"));
  expect(res?.status()).toBe(404);
});

test("덱 PDF는 예측 가능한 URL로 제공된다", async ({ request }) => {
  test.skip(!existsSync("out/decks/hello.pdf"), "out/decks/hello.pdf 없음 — `npm run pdf`를 먼저 실행해야 검증된다 (CI는 e2e 전에 pdf를 실행한다)");
  const res = await request.get(sitePath("/decks/hello.pdf"));
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});
