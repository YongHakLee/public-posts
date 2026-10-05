import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { works } from "@content/registry";
import { themeNames } from "@/themes";
import { validateWorks } from "@/works/validate";

describe("content/registry.ts", () => {
  it("검증 오류가 없다", () => {
    expect(validateWorks(works, { themeNames, fileExists: (path) => existsSync(path) })).toEqual([]);
  });
});
