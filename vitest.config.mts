import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: dir("./src/") },
      { find: /^@content\//, replacement: dir("./content/") },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
