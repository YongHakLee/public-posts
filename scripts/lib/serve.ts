import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export type ServeOptions = { root: string; basePath: string; port: number; host?: string };
export type RunningServer = { url: string; close: () => Promise<void> };

function splitUrl(urlPath: string): { pathname: string; search: string } {
  const noHash = urlPath.split("#")[0] ?? "";
  const q = noHash.indexOf("?");
  return q < 0 ? { pathname: noHash, search: "" } : { pathname: noHash.slice(0, q), search: noHash.slice(q) };
}

/** GitHub Pages처럼 basePath 아래만 서빙한다. 루트 밖으로 나가는 경로와 해석 불가 URL은 null. */
export function resolveRequestPath(root: string, basePath: string, urlPath: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(splitUrl(urlPath).pathname);
  } catch {
    return null;
  }
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return null;
  let rel = pathname.slice(basePath.length) || "/";
  if (rel.endsWith("/")) rel += "index.html";
  const rootAbs = resolve(root);
  const abs = resolve(rootAbs, `.${normalize(rel)}`);
  if (abs !== rootAbs && !abs.startsWith(rootAbs + sep)) return null;
  return abs;
}

export function startServer({ root, basePath, port, host = "127.0.0.1" }: ServeOptions): Promise<RunningServer> {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = req.url ?? "/";
      const file = resolveRequestPath(root, basePath, urlPath);
      if (file) {
        const info = await stat(file).catch(() => null);
        if (info?.isDirectory()) {
          const { pathname, search } = splitUrl(urlPath);
          res.writeHead(308, { Location: `${pathname}/${search}` });
          res.end();
          return;
        }
        if (info?.isFile()) {
          const content = await readFile(file);
          res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
          res.end(content);
          return;
        }
      }
      const body = await readFile(join(root, "404.html")).catch(() => Buffer.from("Not Found"));
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(body);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  });

  return new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      ok({
        url: `http://${host}:${actualPort}${basePath}/`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}
