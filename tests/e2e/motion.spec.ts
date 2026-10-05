import { expect, test } from "@playwright/test";
import { sitePath } from "./helpers";

const MOTION = sitePath("/motion/hello-motion/");

test("보이면 재생하고 Space로 일시정지·재개, R로 다시 재생", async ({ page }) => {
  await page.goto(MOTION);
  const stage = page.locator("[data-motion-stage]");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-playing", "false");
  await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.keyboard.press("Space");
  await page.keyboard.press("r");
  await expect(stage).toHaveAttribute("data-playing", "true");
});

test("동작 줄이기 설정이면 재생하지 않고 최종 상태를 보여준다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(MOTION);
  await expect(page.locator("[data-motion-stage]")).toHaveAttribute("data-playing", "false");
  await expect(page.locator(".hm-caption")).toHaveCSS("opacity", "1");
});
