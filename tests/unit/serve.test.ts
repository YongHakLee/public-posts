import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveRequestPath, startServer, type RunningServer } from "../../scripts/lib/serve";

const BASE = "/public-posts";
const root = mkdtempSync(join(tmpdir(), "serve-out-"));
mkdirSync(join(root, "decks/hello"), { recursive: true });
writeFileSync(join(root, "index.html"), "<p>home</p>");
writeFileSync(join(root, "404.html"), "<p>missing</p>");
writeFileSync(join(root, "decks/hello/index.html"), "<p>deck</p>");
writeFileSync(join(root, "decks/hello.pdf"), "%PDF-1.7");

describe("resolveRequestPath", () => {
  it("basePath 밖은 null", () => {
    expect(resolveRequestPath(root, BASE, "/other/")).toBeNull();
  });
  it("basePath와 비슷한 접두어는 거부", () => {
    expect(resolveRequestPath(root, BASE, "/public-postsX/index.html")).toBeNull();
  });
  it("슬래시로 끝나면 index.html, 쿼리·해시는 무시", () => {
    expect(resolveRequestPath(root, BASE, "/public-posts/decks/hello/?print#3")).toBe(join(root, "decks/hello/index.html"));
    expect(resolveRequestPath(root, BASE, "/public-posts")).toBe(join(root, "index.html"));
  });
  it("상위 디렉터리로 나가지 못한다", () => {
    const resolved = resolveRequestPath(root, BASE, "/public-posts/../../etc/passwd");
    expect(resolved === null || resolved.startsWith(root)).toBe(true);
  });
  it("깨진 퍼센트 인코딩은 null", () => {
    expect(resolveRequestPath(root, BASE, "/public-posts/%E0%A4%A")).toBeNull();
  });
});

describe("startServer", () => {
  let server: RunningServer;
  beforeAll(async () => {
    server = await startServer({ root, basePath: BASE, port: 0 });
  });
  afterAll(async () => {
    await server.close();
  });

  it("url은 basePath로 끝난다", () => {
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/public-posts\/$/);
  });
  it("index.html을 HTML로 서빙", async () => {
    const res = await fetch(server.url);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("home");
  });
  it("디렉터리는 슬래시를 붙여 308, 쿼리 유지", async () => {
    const res = await fetch(new URL("decks/hello?print", server.url), { redirect: "manual" });
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("/public-posts/decks/hello/?print");
  });
  it("PDF는 application/pdf", async () => {
    const res = await fetch(new URL("decks/hello.pdf", server.url));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });
  it("없는 파일은 404.html 내용과 404", async () => {
    const res = await fetch(new URL("decks/nope/", server.url));
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("missing");
  });
  it("깨진 URL에도 죽지 않고 404", async () => {
    const res = await fetch(`${server.url}%E0%A4%A`);
    expect(res.status).toBe(404);
    const again = await fetch(server.url);
    expect(again.status).toBe(200);
  });
});
