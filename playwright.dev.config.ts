import { defineConfig, devices } from "@playwright/test";
import { BASE_PATH } from "./site.config";

/** dev 전용 화면(갤러리) 검사. 프로덕션 빌드를 대상으로 하는 playwright.config.ts와 분리한다. */
export default defineConfig({
  testDir: "tests/dev",
  reporter: "list",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev",
    url: `http://localhost:3000${BASE_PATH}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
