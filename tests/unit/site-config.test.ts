import { describe, expect, it } from "vitest";
import { BASE_PATH } from "../../site.config";

describe("BASE_PATH", () => {
  it("슬래시로 시작하고 슬래시로 끝나지 않는 단일 세그먼트다", () => {
    expect(BASE_PATH).toMatch(/^\/[a-z0-9-]+$/);
  });
});
